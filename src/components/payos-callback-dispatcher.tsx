"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type CallbackFlow = "checkout" | "staff" | "subscription";

type PendingCheckoutPayment = {
  orderId?: number | null;
  orderCode?: string;
  paymentLinkId?: string;
  createdAt?: string;
};

type PendingSubscriptionPayment = {
  orderCode?: string;
  paymentLinkId?: string;
  createdAt?: string;
};

type PendingStaffPayment = {
  orderId?: number | null;
  orderCode?: string;
  paymentLinkId?: string;
  createdAt?: string;
};

const CHECKOUT_PENDING_PAYMENT_STORAGE_KEY = "checkout:pending-payment";
const SUBSCRIPTION_PAYMENT_STORAGE_KEY = "subscriptionPayment.pending";
const STAFF_POS_PENDING_PAYMENT_STORAGE_KEY = "staff-pos-payment.pending";

function parsePendingCheckoutPayment(
  raw: string | null,
): PendingCheckoutPayment | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return null;

    return {
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

function parsePendingSubscriptionPayment(
  raw: string | null,
): PendingSubscriptionPayment | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return null;

    return {
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

function parsePendingStaffPayment(
  raw: string | null,
): PendingStaffPayment | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return null;

    return {
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

function extractNumericOrderId(value: string | null | undefined): number | null {
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

function parseTimestamp(value?: string): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function buildTargetPath(
  flow: CallbackFlow,
  search: string,
  fallbackOrderId?: number | null,
): string {
  const pathname =
    flow === "checkout"
      ? "/checkout"
      : flow === "staff"
        ? "/staff/payos-callback"
        : "/subscription/momo-callback";
  const params = new URLSearchParams(search);

  if (
    (flow === "checkout" || flow === "staff") &&
    fallbackOrderId != null &&
    !params.get("orderId") &&
    !params.get("orderCode")
  ) {
    params.set("orderId", String(fallbackOrderId));
  }

  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export default function PayosCallbackDispatcher() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checkoutPending, setCheckoutPending] =
    useState<PendingCheckoutPayment | null>(null);
  const [subscriptionPending, setSubscriptionPending] =
    useState<PendingSubscriptionPayment | null>(null);
  const [staffPending, setStaffPending] = useState<PendingStaffPayment | null>(
    null,
  );

  useEffect(() => {
    const nextCheckout = parsePendingCheckoutPayment(
      window.sessionStorage.getItem(CHECKOUT_PENDING_PAYMENT_STORAGE_KEY),
    );
    const nextSubscription = parsePendingSubscriptionPayment(
      window.sessionStorage.getItem(SUBSCRIPTION_PAYMENT_STORAGE_KEY),
    );
    const nextStaff = parsePendingStaffPayment(
      window.sessionStorage.getItem(STAFF_POS_PENDING_PAYMENT_STORAGE_KEY),
    );

    const frameId = window.requestAnimationFrame(() => {
      setCheckoutPending(nextCheckout);
      setSubscriptionPending(nextSubscription);
      setStaffPending(nextStaff);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const search = searchParams.toString();

  const resolvedFlow = useMemo<CallbackFlow | null>(() => {
    const queryOrderRaw =
      searchParams.get("orderCode") ?? searchParams.get("orderId");
    const queryPaymentLinkId = String(searchParams.get("id") ?? "").trim();
    const queryOrderId = extractNumericOrderId(queryOrderRaw);
    const queryOrderCode = String(queryOrderRaw ?? "").trim();

    const checkoutMatches = Boolean(
      checkoutPending &&
        ((checkoutPending.paymentLinkId &&
          queryPaymentLinkId &&
          checkoutPending.paymentLinkId === queryPaymentLinkId) ||
          (checkoutPending.orderCode &&
            queryOrderCode &&
            checkoutPending.orderCode === queryOrderCode) ||
          (checkoutPending.orderId != null &&
            queryOrderId != null &&
            checkoutPending.orderId === queryOrderId)),
    );

    const staffMatches = Boolean(
      staffPending &&
        ((staffPending.paymentLinkId &&
          queryPaymentLinkId &&
          staffPending.paymentLinkId === queryPaymentLinkId) ||
          (staffPending.orderCode &&
            queryOrderCode &&
            staffPending.orderCode === queryOrderCode) ||
          (staffPending.orderId != null &&
            queryOrderId != null &&
            staffPending.orderId === queryOrderId)),
    );

    const subscriptionMatches = Boolean(
      subscriptionPending &&
        ((subscriptionPending.paymentLinkId &&
          queryPaymentLinkId &&
          subscriptionPending.paymentLinkId === queryPaymentLinkId) ||
          (subscriptionPending.orderCode &&
            queryOrderCode &&
            subscriptionPending.orderCode === queryOrderCode)),
    );

    if (staffMatches && !checkoutMatches && !subscriptionMatches) {
      return "staff";
    }
    if (checkoutMatches && !staffMatches && !subscriptionMatches) {
      return "checkout";
    }
    if (staffMatches && checkoutMatches && !subscriptionMatches) {
      return "staff";
    }
    if (subscriptionMatches && !checkoutMatches && !staffMatches) {
      return "subscription";
    }

    if (staffPending && !checkoutPending && !subscriptionPending) {
      return "staff";
    }
    if (checkoutPending && !staffPending && !subscriptionPending) {
      return "checkout";
    }
    if (subscriptionPending && !checkoutPending && !staffPending) {
      return "subscription";
    }

    if (checkoutPending || staffPending || subscriptionPending) {
      const checkoutTime = parseTimestamp(checkoutPending?.createdAt);
      const staffTime = parseTimestamp(staffPending?.createdAt);
      const subscriptionTime = parseTimestamp(subscriptionPending?.createdAt);

      const rankedFlows: Array<{ flow: CallbackFlow; time: number }> = [];
      if (checkoutPending && checkoutTime != null) {
        rankedFlows.push({ flow: "checkout", time: checkoutTime });
      }
      if (staffPending && staffTime != null) {
        rankedFlows.push({ flow: "staff", time: staffTime });
      }
      if (subscriptionPending && subscriptionTime != null) {
        rankedFlows.push({ flow: "subscription", time: subscriptionTime });
      }
      rankedFlows.sort((a, b) => b.time - a.time);

      if (rankedFlows[0]) {
        return rankedFlows[0].flow;
      }

      if (staffPending) return "staff";
      if (checkoutPending) return "checkout";
      if (subscriptionPending) return "subscription";
    }

    if (queryOrderId != null) {
      if (staffPending && !checkoutPending) return "staff";
      return "checkout";
    }

    return null;
  }, [checkoutPending, searchParams, staffPending, subscriptionPending]);

  const checkoutFallbackOrderId =
    checkoutPending?.orderId ?? staffPending?.orderId ?? null;
  const staffFallbackOrderId =
    staffPending?.orderId ?? checkoutPending?.orderId ?? null;
  const fallbackOrderIdForResolvedFlow =
    resolvedFlow === "staff" ? staffFallbackOrderId : checkoutFallbackOrderId;

  useEffect(() => {
    if (!resolvedFlow) return;
    router.replace(
      buildTargetPath(resolvedFlow, search, fallbackOrderIdForResolvedFlow),
    );
  }, [fallbackOrderIdForResolvedFlow, resolvedFlow, router, search]);

  return (
    <main className="min-h-screen bg-[#f6f3ef] px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-xl rounded-3xl border border-[#e7ddd0] bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <h1 className="text-2xl font-semibold">Đang xử lý kết quả thanh toán</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {resolvedFlow
            ? "Hệ thống đang chuyển bạn về đúng màn hình thanh toán."
            : "Không xác định chắc chắn đây là thanh toán đơn hàng hay gói dịch vụ. Chọn nơi bạn muốn tiếp tục."}
        </p>

        {resolvedFlow ? (
          <div className="mt-6 h-12 w-12 animate-spin rounded-full border-4 border-[#eadfce] border-t-[#8a5a32]" />
          ) : (
            <div className="mt-8 grid gap-3">
              <Button
                className="h-11 bg-[#1f6a4b] text-white hover:bg-[#17533b]"
                onClick={() =>
                  router.replace(
                    buildTargetPath("staff", search, staffFallbackOrderId),
                  )
                }
              >
                Tiếp tục POS staff
              </Button>
              <Button
                className="h-11 bg-[#693916] text-white hover:bg-[#583015]"
                onClick={() =>
                router.replace(
                  buildTargetPath("checkout", search, checkoutFallbackOrderId),
                )
                }
              >
                Tiếp tục đơn khách hàng
              </Button>
            <Button
              variant="outline"
              className="h-11 border-[#d8c7b3] text-[#693916] hover:bg-[#faf4ed]"
              onClick={() =>
                router.replace(buildTargetPath("subscription", search))
              }
            >
              Tiếp tục gói dịch vụ
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
