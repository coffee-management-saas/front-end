"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PortalFooter } from "@/components/portal/PortalFooter";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { formatCurrency } from "@/lib/utils";

type PaymentStatus = "loading" | "success" | "failed";

type PendingSubscriptionPayment = {
  bin?: string;
  accountNumber?: string;
  accountName?: string;
  amount?: number | null;
  description?: string;
  orderCode?: string;
  currency?: string;
  paymentLinkId?: string;
  status?: string;
  expiredAt?: string;
  qrCode?: string;
  checkoutUrl?: string | null;
  createdAt?: string;
};

type DetailRow = {
  label: string;
  value: string;
  mono?: boolean;
  badge?: boolean;
  badgeTone?: "success" | "warning";
};

const SUBSCRIPTION_PAYMENT_STORAGE_KEY = "subscriptionPayment.pending";

const coerceAmount = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const parsePendingPayment = (
  raw: string | null,
): PendingSubscriptionPayment | null => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return null;

    return {
      bin: typeof parsed.bin === "string" ? parsed.bin : "",
      accountNumber:
        typeof parsed.accountNumber === "string" ? parsed.accountNumber : "",
      accountName:
        typeof parsed.accountName === "string" ? parsed.accountName : "",
      amount: coerceAmount(parsed.amount),
      description:
        typeof parsed.description === "string" ? parsed.description : "",
      orderCode: typeof parsed.orderCode === "string" ? parsed.orderCode : "",
      currency: typeof parsed.currency === "string" ? parsed.currency : "",
      paymentLinkId:
        typeof parsed.paymentLinkId === "string" ? parsed.paymentLinkId : "",
      status: typeof parsed.status === "string" ? parsed.status : "",
      expiredAt: typeof parsed.expiredAt === "string" ? parsed.expiredAt : "",
      qrCode: typeof parsed.qrCode === "string" ? parsed.qrCode : "",
      checkoutUrl:
        typeof parsed.checkoutUrl === "string" ? parsed.checkoutUrl : null,
      createdAt: typeof parsed.createdAt === "string" ? parsed.createdAt : "",
    };
  } catch {
    return null;
  }
};

const formatDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const formatAmountLabel = (amount: number | null, currency: string) => {
  if (amount === null) return "Đang cập nhật";
  return `${formatCurrency(amount)}${currency && currency !== "VND" ? ` ${currency}` : ""}`;
};

const StatusIcon = ({ failed = false }: { failed?: boolean }) => (
  <div
    className={[
      "mx-auto flex h-20 w-20 items-center justify-center rounded-full",
      failed ? "bg-[#feeceb]" : "bg-[#33c27f]",
    ].join(" ")}
  >
    <svg
      className={failed ? "h-10 w-10 text-[#dc4c46]" : "h-10 w-10 text-white"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      {failed ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      )}
    </svg>
  </div>
);

const DetailItem = ({ label, value, mono, badge, badgeTone }: DetailRow) => (
  <div className="flex flex-col gap-1 text-sm text-slate-700 sm:flex-row sm:items-start">
    <span className="font-semibold text-slate-800 sm:min-w-[140px]">
      {label}:
    </span>
    {badge ? (
      <span
        className={[
          "inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold",
          badgeTone === "warning"
            ? "bg-[#fff2e2] text-[#b96b14]"
            : "bg-[#e7f7ee] text-[#218a58]",
        ].join(" ")}
      >
        {value}
      </span>
    ) : (
      <span
        className={[
          "break-all text-slate-700",
          mono ? "font-mono text-[13px]" : "",
        ].join(" ")}
      >
        {value}
      </span>
    )}
  </div>
);

export default function SubscriptionPaymentCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pendingPayment, setPendingPayment] =
    useState<PendingSubscriptionPayment | null>(null);

  const resultCode = searchParams.get("resultCode");
  const code = String(searchParams.get("code") ?? "")
    .trim()
    .toUpperCase();
  const statusParam = String(searchParams.get("status") ?? "")
    .trim()
    .toUpperCase();
  const cancelParam = String(searchParams.get("cancel") ?? "")
    .trim()
    .toLowerCase();
  const orderCodeFromQuery =
    searchParams.get("orderCode") ?? searchParams.get("orderId") ?? "";
  const paymentLinkIdFromQuery = searchParams.get("id") ?? "";
  const amountFromQuery = useMemo(
    () => coerceAmount(searchParams.get("amount")),
    [searchParams],
  );

  const status: PaymentStatus = useMemo(() => {
    if (resultCode) {
      return resultCode === "0" ? "success" : "failed";
    }

    if (statusParam) {
      if (["PAID", "SUCCESS", "COMPLETED"].includes(statusParam)) {
        return "success";
      }
      if (
        ["FAILED", "CANCELLED", "CANCELED", "EXPIRED"].includes(statusParam)
      ) {
        return "failed";
      }
    }

    if (cancelParam === "true") {
      return "failed";
    }

    if (code) {
      return code === "00" ? "success" : "failed";
    }

    return "loading";
  }, [cancelParam, code, resultCode, statusParam]);

  useEffect(() => {
    const stored = parsePendingPayment(
      window.sessionStorage.getItem(SUBSCRIPTION_PAYMENT_STORAGE_KEY),
    );

    const nextPendingPayment = (() => {
      if (!stored) return null;

      const matchedOrderCode =
        !orderCodeFromQuery || stored.orderCode === orderCodeFromQuery;
      const matchedPaymentLinkId =
        !paymentLinkIdFromQuery ||
        stored.paymentLinkId === paymentLinkIdFromQuery;

      return matchedOrderCode && matchedPaymentLinkId ? stored : null;
    })();

    const frameId = window.requestAnimationFrame(() => {
      setPendingPayment(nextPendingPayment);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [orderCodeFromQuery, paymentLinkIdFromQuery]);

  const amountToDisplay = amountFromQuery ?? pendingPayment?.amount ?? null;
  const orderCode = orderCodeFromQuery || pendingPayment?.orderCode || "";
  const paymentLinkId =
    paymentLinkIdFromQuery || pendingPayment?.paymentLinkId || "";
  const currency = pendingPayment?.currency || "VND";
  const description = pendingPayment?.description || "Gói dịch vụ";
  const transactionTime = pendingPayment?.createdAt
    ? formatDateTime(pendingPayment.createdAt)
    : "Đang cập nhật";
  const statusLabel =
    status === "success"
      ? "Đã thanh toán"
      : status === "failed"
        ? "Chưa hoàn tất"
        : "Đang xác minh";

  const detailRows: DetailRow[] = [
    {
      label: "Mã đơn hàng",
      value: orderCode ? `#${orderCode}` : "Đang cập nhật",
    },
    {
      label: "Mã giao dịch",
      value: paymentLinkId || "Đang cập nhật",
      mono: true,
    },
    {
      label: "Gói dịch vụ",
      value: description,
    },
    {
      label: "Số tiền",
      value: formatAmountLabel(amountToDisplay, currency),
    },
    {
      label: "Phương thức",
      value: "PayOS",
    },
    {
      label: "Thời gian",
      value: transactionTime,
    },
    {
      label: "Trạng thái",
      value: statusLabel,
      badge: true,
      badgeTone: status === "failed" ? "warning" : "success",
    },
  ];

  return (
    <main className="min-h-screen bg-[#dadfdd] text-slate-900 flex flex-col">
      <section className="flex-1 px-4 py-10 md:px-6 md:py-16">
        <div className="mx-auto w-full max-w-3xl rounded-[28px] border border-[#dbece3] bg-white px-6 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)] md:px-10 md:py-10">
          {status === "loading" ? (
            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full border-4 border-[#d8efe2] border-t-[#33c27f] animate-spin" />
              <h1 className="mt-6 text-3xl font-semibold text-slate-900">
                Đang xác minh thanh toán
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500 md:text-base">
                Hệ thống đang đợi kết quả từ PayOS. Trang này sẽ giữ nguyên cho
                đến khi giao dịch được xác nhận.
              </p>
            </div>
          ) : (
            <>
              <StatusIcon failed={status === "failed"} />

              <div className="mt-6 text-center">
                <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
                  {status === "success"
                    ? "Thanh toán thành công"
                    : "Thanh toán chưa hoàn tất"}
                </h1>
                <p className="mt-3 text-sm leading-7 text-slate-500 md:text-base">
                  {status === "success"
                    ? "Giao dịch của bạn đã hoàn tất. Gói dịch vụ sẽ được kích hoạt ngay sau khi hệ thống xác nhận."
                    : "Hệ thống chưa nhận được xác nhận thành công từ PayOS. Bạn có thể kiểm tra lại giao dịch hoặc thử thanh toán lại."}
                </p>
              </div>

              <div className="mt-7 rounded-2xl border border-[#dff0e7] bg-[#f7fcf9] p-5 md:p-6">
                <div className="space-y-3">
                  {detailRows.map((row) => (
                    <DetailItem
                      key={row.label}
                      label={row.label}
                      value={row.value}
                      mono={row.mono}
                      badge={row.badge}
                      badgeTone={row.badgeTone}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-3 md:flex-row">
                <button
                  type="button"
                  onClick={() => router.push("/subscription")}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#33c27f] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#27ac6d]"
                >
                  Về trang quản lý gói dịch vụ
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/portal")}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#d6e4dc] bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-[#f6faf8]"
                >
                  Về trang chủ
                </button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#e8f7ef] text-[#2ba56a]">
                  ✓
                </span>
                <span>via</span>
                <span className="font-semibold text-[#2ba56a]">PayOS</span>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
