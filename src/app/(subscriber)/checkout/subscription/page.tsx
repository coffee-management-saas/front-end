"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PortalFooter } from "@/components/portal/PortalFooter";
import { PortalHeader } from "@/components/portal/PortalHeader";

type BillingCycle = "MONTHLY" | "YEARLY";

type CheckoutForm = {
  shopName: string;
  address: string;
  phone: string;
  email: string;
  domain: string;
  autoRenewal: boolean;
};

const getApiMessage = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") return null;
  if (!("message" in payload)) return null;
  const msg = (payload as Record<string, unknown>).message;
  return typeof msg === "string" && msg.trim() ? msg.trim() : null;
};

const parseJsonSafely = async <T,>(res: Response): Promise<T | null> => {
  const raw = await res.text().catch(() => "");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const extractCheckoutUrl = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;

  const direct = obj.payUrl;
  if (typeof direct === "string" && direct.trim()) return direct.trim();

  const data = obj.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const candidates = [d.payUrl, d.checkoutUrl, d.paymentUrl, d.redirectUrl];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }
  }

  const candidates = [obj.checkoutUrl, obj.paymentUrl, obj.redirectUrl];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim())
      return candidate.trim();
  }

  return null;
};

export default function SubscriptionCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const subscriptionPlanId = useMemo(() => {
    const raw = searchParams.get("subscriptionPlanId");
    const n = raw ? Math.floor(Number(raw)) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [searchParams]);

  const billingCycle = useMemo(() => {
    const raw = String(searchParams.get("billingCycle") ?? "")
      .trim()
      .toUpperCase();
    return raw === "MONTHLY" || raw === "YEARLY" ? (raw as BillingCycle) : null;
  }, [searchParams]);

  const canCheckout = Boolean(subscriptionPlanId && billingCycle);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CheckoutForm>({
    shopName: "",
    address: "",
    phone: "",
    email: "",
    domain: "",
    autoRenewal: true,
  });

  const runCheckout = useCallback(async (payload: CheckoutForm) => {
    if (!subscriptionPlanId || !billingCycle) return;

    const callOnce = async () =>
      fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionPlanId,
          billingCycle,
          ...payload,
        }),
        credentials: "include",
        cache: "no-store",
      });

    let res: Response | null = await callOnce().catch(() => null);
    if (!res) {
      setError("Không kết nối được máy chủ.");
      return;
    }

    // If session expired, refresh once then retry.
    if (res.status === 401 || res.status === 403) {
      const refreshRes = await fetch("/api/auth/refresh", {
        method: "POST",
        cache: "no-store",
        credentials: "include",
      }).catch(() => null);

      if (refreshRes?.ok) {
        res = await callOnce().catch(() => null);
        if (!res) {
          setError("Không kết nối được máy chủ.");
          return;
        }
      }
    }

    const payloadJson = await parseJsonSafely<unknown>(res);
    if (!res.ok) {
      setError(
        getApiMessage(payloadJson) || `Thanh toán thất bại (${res.status}).`,
      );
      return;
    }

    const checkoutUrl = extractCheckoutUrl(payloadJson);
    if (!checkoutUrl) {
      setError("Không nhận được liên kết thanh toán (payUrl).");
      return;
    }

    window.location.assign(checkoutUrl);
  }, [billingCycle, subscriptionPlanId]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0f0a07] text-white">
      <PortalHeader />

      <section className="px-6 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-neutral-800 bg-neutral-950/60 p-8 shadow-[0_26px_80px_rgba(0,0,0,0.9)]">
          <h1 className="text-xl font-semibold">Thanh toán gói thuê</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Nhập thông tin và bấm “Tạo thanh toán” để chuyển sang cổng thanh toán.
          </p>

          {!canCheckout ? (
            <div className="mt-6 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-sm text-orange-100">
              Thiếu thông tin gói thuê. Vui lòng quay lại và chọn lại gói.
            </div>
          ) : null}

          {error ? (
            <div className="mt-6 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-sm text-orange-100">
              {error}
            </div>
          ) : null}

          <form
            className="mt-6 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!canCheckout) return;
              setLoading(true);
              setError(null);
              void runCheckout(form).finally(() => setLoading(false));
            }}
          >
            <div className="grid gap-3">
              <input
                className="w-full rounded-lg bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                placeholder="Tên cửa hàng"
                value={form.shopName}
                onChange={(e) => setForm((p) => ({ ...p, shopName: e.target.value }))}
                required
              />
              <input
                className="w-full rounded-lg bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                placeholder="Địa chỉ"
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                required
              />
              <input
                className="w-full rounded-lg bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                placeholder="Số điện thoại"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                required
              />
              <input
                className="w-full rounded-lg bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required
              />
              <input
                className="w-full rounded-lg bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                placeholder="Domain"
                value={form.domain}
                onChange={(e) => setForm((p) => ({ ...p, domain: e.target.value }))}
                required
              />
              <label className="flex items-center gap-2 text-sm text-neutral-300">
                <input
                  type="checkbox"
                  checked={form.autoRenewal}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      autoRenewal: e.target.checked,
                    }))
                  }
                />
                Tự động gia hạn
              </label>
            </div>

            <button
              type="submit"
              disabled={!canCheckout || loading}
              className={[
                "w-full inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold",
                !canCheckout || loading
                  ? "bg-neutral-700 text-neutral-300 cursor-not-allowed"
                  : "bg-orange-500 text-black hover:bg-orange-400",
              ].join(" ")}
            >
              {loading ? "Đang tạo thanh toán..." : "Tạo thanh toán"}
            </button>
          </form>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-neutral-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
              onClick={() => router.push("/subscription")}
            >
              Quay lại
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-neutral-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-900"
              onClick={() => router.push("/system/login")}
            >
              Đăng nhập
            </button>
          </div>
        </div>
      </section>

      <PortalFooter />
    </main>
  );
}
