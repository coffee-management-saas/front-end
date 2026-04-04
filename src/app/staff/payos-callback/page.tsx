"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleAlert, Loader2, RotateCcw, ShieldCheck } from "lucide-react";
import { useAppContext } from "@/app/AppProvider";
import { Button } from "@/components/ui/button";
import { getOrderById } from "@/services/order.service";
import type { OrderResponse } from "@/types/order";

type CallbackStatus = "loading" | "success" | "failed" | "unknown";
type PaymentMethod = "cash" | "payos";

type PendingStaffPayment = {
  method: PaymentMethod;
  orderId: number | null;
  orderCode?: string;
  paymentLinkId?: string;
  createdAt?: string;
};

const STAFF_POS_PENDING_PAYMENT_STORAGE_KEY = "staff-pos-payment.pending";
const STAFF_POS_CHECKOUT_STORAGE_KEY = "staff-pos-checkout";

function parsePendingStaffPayment(raw: string | null): PendingStaffPayment | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PendingStaffPayment>;
    const method =
      parsed.method === "payos" || parsed.method === "cash"
        ? parsed.method
        : null;
    if (!method) return null;

    return {
      method,
      orderId:
        typeof parsed.orderId === "number" && Number.isFinite(parsed.orderId)
          ? parsed.orderId
          : null,
      orderCode:
        typeof parsed.orderCode === "string" ? parsed.orderCode.trim() : "",
      paymentLinkId:
        typeof parsed.paymentLinkId === "string"
          ? parsed.paymentLinkId.trim()
          : "",
      createdAt:
        typeof parsed.createdAt === "string" ? parsed.createdAt : "",
    };
  } catch {
    return null;
  }
}

function clearPendingStaffPayment() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STAFF_POS_PENDING_PAYMENT_STORAGE_KEY);
  } catch {}
}

function extractRedirectOrderId(value: string | null | undefined): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  if (raw.includes("_")) {
    const parts = raw.split("_");
    for (let i = parts.length - 1; i >= 0; i -= 1) {
      if (/^\d+$/.test(parts[i])) {
        const parsed = Number(parts[i]);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
      }
    }
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function resolveRedirectPaymentStatus(
  searchParams: { get: (key: string) => string | null },
): CallbackStatus {
  const resultCode = searchParams.get("resultCode");
  const code = String(searchParams.get("code") ?? "")
    .trim()
    .toUpperCase();
  const status = String(searchParams.get("status") ?? "")
    .trim()
    .toUpperCase();
  const cancel = String(searchParams.get("cancel") ?? "")
    .trim()
    .toLowerCase();

  if (resultCode !== null) {
    return resultCode === "0" ? "success" : "failed";
  }

  if (status) {
    if (["PAID", "SUCCESS", "COMPLETED"].includes(status)) return "success";
    if (["FAILED", "CANCELLED", "CANCELED", "EXPIRED"].includes(status)) {
      return "failed";
    }
    return "loading";
  }

  if (cancel === "true") return "failed";
  if (code) return code === "00" ? "success" : "failed";

  return "unknown";
}

export default function StaffPayosCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tokens } = useAppContext();

  const [pendingPayment, setPendingPayment] =
    useState<PendingStaffPayment | null>(null);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const queryOrderRaw =
    searchParams.get("orderCode") ?? searchParams.get("orderId") ?? "";
  const queryPaymentLinkId = String(searchParams.get("id") ?? "").trim();

  const callbackStatus = useMemo(
    () => resolveRedirectPaymentStatus(searchParams),
    [searchParams],
  );

  useEffect(() => {
    const stored = parsePendingStaffPayment(
      window.sessionStorage.getItem(STAFF_POS_PENDING_PAYMENT_STORAGE_KEY),
    );

    const queryOrderId = extractRedirectOrderId(queryOrderRaw);
    const hasReference = Boolean(queryOrderRaw || queryPaymentLinkId);
    const matchedStored = Boolean(
      stored &&
        ((stored.paymentLinkId &&
          queryPaymentLinkId &&
          stored.paymentLinkId === queryPaymentLinkId) ||
          (stored.orderCode &&
            queryOrderRaw &&
            stored.orderCode === queryOrderRaw) ||
          (stored.orderId != null &&
            queryOrderId != null &&
            stored.orderId === queryOrderId)),
    );

    const frameId = window.requestAnimationFrame(() => {
      setPendingPayment(!hasReference || matchedStored ? stored : null);
      setHydrated(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [queryOrderRaw, queryPaymentLinkId]);

  const resolvedOrderId =
    extractRedirectOrderId(queryOrderRaw) ?? pendingPayment?.orderId ?? null;

  useEffect(() => {
    if (!tokens.accessToken || !resolvedOrderId) return;

    let active = true;
    getOrderById(tokens.accessToken, resolvedOrderId)
      .then((result) => {
        if (!active) return;
        setOrder(result);
      })
      .catch(() => {
        if (!active) return;
        setOrder(null);
      });

    return () => {
      active = false;
    };
  }, [resolvedOrderId, tokens.accessToken]);

  const effectiveStatus = useMemo<CallbackStatus>(() => {
    if (callbackStatus === "success" || callbackStatus === "failed") {
      return callbackStatus;
    }

    const orderStatus = String(order?.orderStatus ?? "")
      .trim()
      .toUpperCase();
    if (["PAID", "COMPLETED", "SUCCESS"].includes(orderStatus)) {
      return "success";
    }

    return callbackStatus;
  }, [callbackStatus, order?.orderStatus]);

  useEffect(() => {
    if (!hydrated) return;
    if (effectiveStatus === "loading" || effectiveStatus === "unknown") return;

    clearPendingStaffPayment();
    if (effectiveStatus === "success") {
      try {
        sessionStorage.removeItem(STAFF_POS_CHECKOUT_STORAGE_KEY);
      } catch {}
    }
  }, [effectiveStatus, hydrated]);

  const title =
    effectiveStatus === "success"
      ? "Thanh toán thành công"
      : effectiveStatus === "failed"
        ? "Thanh toán chưa hoàn tất"
        : effectiveStatus === "loading"
          ? "Đang xác minh thanh toán"
          : "Không tìm thấy kết quả thanh toán";

  const description =
    effectiveStatus === "success"
      ? "PayOS đã xác nhận giao dịch. Bạn có thể quay lại POS để tiếp tục bán hàng."
      : effectiveStatus === "failed"
        ? "Giao dịch chưa được xác nhận thành công. Hãy quay lại POS để kiểm tra và thử lại."
        : effectiveStatus === "loading"
          ? "Hệ thống đang đợi phản hồi cuối cùng từ PayOS."
          : "Trang này chưa nhận đủ dữ liệu callback từ PayOS.";

  const gatewayMessage =
    searchParams.get("message") ??
    searchParams.get("status") ??
    searchParams.get("code") ??
    "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f3ef] px-4 py-10">
      <section className="w-full max-w-md rounded-[28px] border border-[#e8ddd0] bg-white p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:p-10">
        <div className="relative mx-auto h-24 w-24">
          {effectiveStatus === "success" && (
            <>
              <div className="absolute inset-0 rounded-full bg-emerald-200/70 animate-ping" />
              <div className="absolute inset-[10px] rounded-full bg-emerald-50 animate-pulse" />
            </>
          )}
          <div
            className={[
              "relative z-10 flex h-24 w-24 items-center justify-center rounded-full",
              effectiveStatus === "success"
                ? "bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50"
                : effectiveStatus === "failed"
                  ? "bg-amber-100 text-amber-600"
                  : "bg-sky-100 text-sky-600",
            ].join(" ")}
          >
            {effectiveStatus === "success" ? (
              <ShieldCheck className="h-11 w-11 animate-[staff-success-pop_700ms_ease-out]" />
            ) : effectiveStatus === "failed" ? (
              <CircleAlert className="h-10 w-10" />
            ) : (
              <Loader2 className="h-10 w-10 animate-spin" />
            )}
          </div>
        </div>

        <h1 className="mt-6 text-3xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
          {description}
        </p>

        {effectiveStatus === "failed" && gatewayMessage && (
          <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {gatewayMessage}
          </p>
        )}

        <Button
          className="mt-8 h-11 w-full bg-[#1f6a4b] text-white hover:bg-[#17533b]"
          onClick={() => router.push("/staff/menu")}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Quay lại POS
        </Button>
      </section>

      <style jsx>{`
        @keyframes staff-success-pop {
          0% {
            opacity: 0;
            transform: scale(0.45);
          }
          55% {
            opacity: 1;
            transform: scale(1.14);
          }
          78% {
            transform: scale(0.96);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </main>
  );
}
