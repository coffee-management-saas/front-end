import Link from "next/link";
import { PortalFooter } from "@/components/portal/PortalFooter";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function parseAmountVnd(raw: string): number | null {
  const n = Number(String(raw ?? "").trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SubscriptionMomoCallbackPage({
  searchParams,
}: Props) {
  const params = (await searchParams) ?? {};

  const resultCode = first(params.resultCode).trim();
  const orderId = first(params.orderId).trim();
  const message = first(params.message).trim();
  const amountRaw = first(params.amount).trim();
  const amount = parseAmountVnd(amountRaw);

  const isSuccess = resultCode === "0";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0f0a07] text-white">
      <PortalHeader />

      <section className="px-6 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_26px_80px_rgba(0,0,0,0.9)] backdrop-blur-md">
          <div className="flex items-start gap-4">
            <div
              className={[
                "mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-full border",
                isSuccess
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-orange-500/30 bg-orange-500/10",
              ].join(" ")}
              aria-hidden="true"
            >
              {isSuccess ? (
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 text-orange-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              )}
            </div>

            <div className="min-w-0">
              <h1 className="text-xl font-semibold">
                {isSuccess
                  ? "Thanh toán thành công"
                  : "Thanh toán không thành công"}
              </h1>
              <p className="mt-2 text-sm text-neutral-400">
                {isSuccess
                  ? "Cảm ơn bạn! Thanh toán đã được ghi nhận."
                  : "Có lỗi xảy ra trong quá trình thanh toán. Bạn có thể thử lại."}
              </p>
            </div>
          </div>

          {isSuccess && amount !== null ? (
            <p className="mt-6 text-3xl font-semibold tracking-tight text-emerald-100">
              {formatCurrency(amount)}
            </p>
          ) : null}

          {!isSuccess && (message || resultCode || orderId || amountRaw) ? (
            <p className="mt-6 text-sm text-orange-100/90">
              {message ? `Lý do: ${message}` : null}
              {!message && resultCode ? `Mã lỗi: ${resultCode}` : null}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/subscription"
              className="inline-flex items-center justify-center rounded-full bg-neutral-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
            >
              Về trang gói thành viên
            </Link>
            <Link
              href="/portal"
              className="inline-flex items-center justify-center rounded-full border border-neutral-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-900"
            >
              Về trang chủ
            </Link>
            {!isSuccess ? (
              <Link
                href="/subscription"
                className="inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-orange-400"
              >
                Thanh toán lại
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <PortalFooter />
    </main>
  );
}
