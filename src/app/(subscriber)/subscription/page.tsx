"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PortalFooter } from "@/components/portal/PortalFooter";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { formatCurrency } from "@/lib/utils";

type SubscriptionPlanStatus = "ACTIVE" | "INACTIVE" | "DELETED" | string;

type SubscriptionPlan = {
  subscriptionPlanId: number;
  subscriptionPlanName: string;
  subscriptionPlanDescription?: string;
  priceMonthly?: number;
  priceYearly?: number;
  configLimit?: Record<string, string>;
  subscriptionPlanStatus?: SubscriptionPlanStatus;
};

type ShopStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "BANNED" | "DELETED" | string;

type Shop = {
  id: number;
  shopName: string;
  address: string;
  phone: string;
  email: string;
  domain: string;
  status: ShopStatus;
};

const normalizeConfigKey = (key: string) =>
  key
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_");

const CONFIG_LIMIT_LABELS_VI: Record<string, string> = {
  storage_gb: "Dung lượng lưu trữ (GB)",
  max_projects: "Số dự án tối đa",
  ai_queries_per_month: "Số lượt truy vấn AI mỗi tháng",
};

const formatConfigKeyVi = (key: string) => {
  const normalized = normalizeConfigKey(key);
  return CONFIG_LIMIT_LABELS_VI[normalized] ?? key.replace(/_/g, " ");
};

const normalizeStatus = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toUpperCase();

const parseJsonSafely = async <T,>(res: Response): Promise<T | null> => {
  const raw = await res.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const coercePlans = (data: unknown): SubscriptionPlan[] => {
  if (!Array.isArray(data)) return [];

  return data
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;

      const subscriptionPlanId = Number(obj.subscriptionPlanId);
      const subscriptionPlanName = String(
        obj.subscriptionPlanName ?? "",
      ).trim();
      const subscriptionPlanDescription = String(
        obj.subscriptionPlanDescription ?? "",
      ).trim();
      const priceMonthly = Number(obj.priceMonthly);
      const priceYearly = Number(obj.priceYearly);
      const subscriptionPlanStatus = String(
        obj.subscriptionPlanStatus ?? "",
      ).trim();
      const configLimitRaw = obj.configLimit;
      const configLimit =
        configLimitRaw && typeof configLimitRaw === "object"
          ? Object.fromEntries(
              Object.entries(configLimitRaw as Record<string, unknown>).map(
                ([k, v]) => [k, String(v ?? "")],
              ),
            )
          : undefined;

      if (!Number.isFinite(subscriptionPlanId) || !subscriptionPlanName)
        return null;

      return {
        subscriptionPlanId,
        subscriptionPlanName,
        subscriptionPlanDescription: subscriptionPlanDescription || undefined,
        priceMonthly: Number.isFinite(priceMonthly) ? priceMonthly : undefined,
        priceYearly: Number.isFinite(priceYearly) ? priceYearly : undefined,
        configLimit,
        subscriptionPlanStatus: subscriptionPlanStatus || undefined,
      } satisfies SubscriptionPlan;
    })
    .filter(Boolean) as SubscriptionPlan[];
};

const coerceShops = (data: unknown): Shop[] => {
  const payload =
    data && typeof data === "object" && "data" in data
      ? (data as Record<string, unknown>).data
      : data;

  if (!Array.isArray(payload)) return [];

  return payload
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;

      const id = Number(obj.id);
      const shopName = String(obj.shopName ?? "").trim();
      const address = String(obj.address ?? "").trim();
      const phone = String(obj.phone ?? "").trim();
      const email = String(obj.email ?? "").trim();
      const domain = String(obj.domain ?? "").trim();
      const status = String(obj.status ?? "").trim();

      if (!Number.isFinite(id) || !shopName) return null;

      return {
        id,
        shopName,
        address,
        phone,
        email,
        domain,
        status,
      } satisfies Shop;
    })
    .filter(Boolean) as Shop[];
};

const pickShopForCheckout = (shops: Shop[]): Shop | null => {
  if (!shops.length) return null;
  const active = shops.find((s) => normalizeStatus(s.status) === "ACTIVE");
  return active ?? shops[0] ?? null;
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
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }

  return null;
};

function PricingPlanCard({
  plan,
  billingMode,
  featured,
  onSelect,
  disabled,
  selecting,
}: {
  plan: SubscriptionPlan;
  billingMode: "monthly" | "yearly";
  featured?: boolean;
  onSelect: (plan: SubscriptionPlan) => void;
  disabled?: boolean;
  selecting?: boolean;
}) {
  const features = Object.entries(plan.configLimit ?? {})
    .filter(([, v]) => String(v ?? "").trim())
    .slice(0, 5)
    .map(([k, v]) => `${formatConfigKeyVi(k)}: ${v}`);

  const hasPrices =
    Number.isFinite(plan.priceMonthly) && Number.isFinite(plan.priceYearly);

  return (
    <div
      className={[
        "rounded-[32px] border shadow-[0_26px_80px_rgba(0,0,0,0.9)] px-8 py-10 flex flex-col justify-between",
        featured
          ? "bg-neutral-900/70 border-orange-500/40 ring-1 ring-orange-500/20"
          : "bg-neutral-950/70 border-neutral-800",
      ].join(" ")}
    >
      <div>
        <h3 className="text-xl mb-2 font-medium">
          {plan.subscriptionPlanName}
        </h3>
        {plan.subscriptionPlanDescription ? (
          <p className="text-sm text-neutral-400 mb-8">
            {plan.subscriptionPlanDescription}
          </p>
        ) : null}

        <div className="mb-6">
          {hasPrices ? (
            <>
              <div className="flex items-baseline gap-1">
                <div className="relative h-12 overflow-hidden">
                  <div
                    className="flex flex-col transition-transform duration-300 ease-out"
                    style={{
                      transform: `translateY(${billingMode === "monthly" ? "0%" : "-50%"})`,
                    }}
                  >
                    <span className="h-12 flex items-center leading-none text-3xl md:text-4xl tracking-tight font-medium">
                      {formatCurrency(plan.priceMonthly ?? 0)}
                    </span>
                    <span className="h-12 flex items-center leading-none text-3xl md:text-4xl tracking-tight font-medium">
                      {formatCurrency(plan.priceYearly ?? 0)}
                    </span>
                  </div>
                </div>
                <span className="text-sm text-neutral-400">/tháng</span>
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                Thanh toán{" "}
                <span className="">
                  {billingMode === "monthly" ? "theo tháng" : "theo năm"}
                </span>
                .
              </p>
            </>
          ) : (
            <>
              <p className="text-3xl md:text-4xl font-semibold tracking-tight mb-1">
                Liên hệ
              </p>
              <p className="text-xs text-neutral-500">
                Liên hệ để được tư vấn gói phù hợp
              </p>
            </>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <button
          type="button"
          className={[
            "w-full inline-flex items-center justify-center rounded-full transition-colors px-6 py-3 text-sm",
            featured
              ? "bg-orange-500 hover:bg-orange-400 font-semibold text-black"
              : "bg-neutral-800/80 hover:bg-neutral-700 font-medium text-white",
            disabled || selecting ? "opacity-70 cursor-not-allowed" : "",
          ].join(" ")}
          onClick={() => onSelect(plan)}
          disabled={Boolean(disabled || selecting)}
        >
          {selecting ? "Đang chuyển..." : "Chọn gói"}
        </button>

        {features.length ? (
          <ul
            className={[
              "space-y-2 text-sm",
              featured ? "text-neutral-50/90" : "text-neutral-300",
            ].join(" ")}
          >
            {features.map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span
                  className={[
                    "mt-[3px] h-1.5 w-1.5 rounded-full",
                    featured ? "bg-orange-400" : "bg-neutral-500",
                  ].join(" ")}
                />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  const [billingMode, setBillingMode] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState<boolean>(true);
  const [plansError, setPlansError] = useState<string>("");
  const [checkoutPlanId, setCheckoutPlanId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!cancelled) setPlansLoading(true);
      try {
        const res = await fetch("/api/subscription-plan", {
          cache: "no-store",
          credentials: "include",
        }).catch(() => null);

        if (!res) {
          if (!cancelled) setPlansError("Không kết nối được máy chủ.");
          return;
        }

        const data = await parseJsonSafely<unknown>(res);

        if (!res.ok) {
          const message =
            data && typeof data === "object" && "message" in data
              ? String((data as Record<string, unknown>).message ?? "")
              : "";
          if (!cancelled) {
            setPlansError(
              message || `Không tải được gói thuê (${res.status}).`,
            );
          }
          return;
        }

        const payload =
          data && typeof data === "object" && "data" in data
            ? (data as Record<string, unknown>).data
            : data;

        const parsed = coercePlans(payload);
        if (!cancelled) {
          setPlans(parsed);
          setPlansError("");
        }
      } finally {
        if (!cancelled) setPlansLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (checkoutPlanId != null) return;

    const billingCycle = billingMode === "monthly" ? "MONTHLY" : "YEARLY";

    setCheckoutPlanId(plan.subscriptionPlanId);
    try {
      const shopsRes = await fetch("/api/shops?page=0&size=50", {
        cache: "no-store",
        credentials: "include",
      }).catch(() => null);

      if (!shopsRes) {
        toast.error("Không kết nối được máy chủ.");
        return;
      }

      if (shopsRes.status === 401 || shopsRes.status === 403) {
        toast.error("Vui lòng đăng nhập để tiếp tục");
        router.push("/system/login");
        return;
      }

      const shopsPayload = await parseJsonSafely<unknown>(shopsRes);
      const shops = coerceShops(shopsPayload);
      const shop = pickShopForCheckout(shops);
      if (!shop) {
        toast.error("Bạn chưa có cửa hàng nào để thanh toán gói thuê.");
        router.push("/system/shop-manager");
        return;
      }

      const checkoutBody = {
        subscriptionPlanId: plan.subscriptionPlanId,
        billingCycle,
        shopName: shop.shopName,
        address: shop.address,
        phone: shop.phone,
        email: shop.email,
        domain: shop.domain,
        autoRenewal: true,
      };

      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutBody),
        credentials: "include",
        cache: "no-store",
      }).catch(() => null);

      if (!res) {
        toast.error("Không kết nối được máy chủ.");
        return;
      }

      const payload = await parseJsonSafely<unknown>(res);

      if (!res.ok) {
        const message =
          payload && typeof payload === "object" && "message" in payload
            ? String((payload as Record<string, unknown>).message ?? "")
            : "";
        toast.error(message || `Thanh toán thất bại (${res.status}).`);
        return;
      }

      const checkoutUrl = extractCheckoutUrl(payload);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      toast.success("Tạo phiên thanh toán thành công!");
    } catch (e) {
      console.error(e);
      toast.error("Không thể tạo phiên thanh toán. Vui lòng thử lại.");
    } finally {
      setCheckoutPlanId(null);
    }
  };

  const plansToRender = useMemo(() => {
    const filtered = plans.filter(
      (p) => normalizeStatus(p.subscriptionPlanStatus) !== "DELETED",
    );
    const actives = filtered.filter(
      (p) => normalizeStatus(p.subscriptionPlanStatus) === "ACTIVE",
    );

    const list = (actives.length ? actives : filtered).slice();
    list.sort((a, b) => {
      const pa = Number.isFinite(a.priceMonthly)
        ? Number(a.priceMonthly)
        : Infinity;
      const pb = Number.isFinite(b.priceMonthly)
        ? Number(b.priceMonthly)
        : Infinity;
      if (pa !== pb) return pa - pb;
      return a.subscriptionPlanId - b.subscriptionPlanId;
    });
    return list;
  }, [plans]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0f0a07] text-white">
      <PortalHeader />

      <section
        className="md:py-22 text-white bg-black mt-0 mb-0 pb-24 relative"
        id="pricing"
      >
        <div className="lg:px-8 max-w-6xl mx-auto px-6">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-orange-400 mb-3">
              #GÓI THUÊ
            </p>
            <h2 className="text-3xl md:text-5xl font-semibold leading-tight text-neutral-50">
              Gói thuê phù hợp với quy mô cửa hàng
            </h2>
            <p className="mt-3 text-sm md:text-base text-neutral-400 max-w-2xl mx-auto">
              Linh hoạt theo tháng hoặc năm, dễ nâng cấp khi cửa hàng phát
              triển.
            </p>
          </div>

          <div className="flex justify-center mb-14">
            <div className="inline-flex items-center rounded-full bg-neutral-900/80 border border-neutral-700/70 px-1 py-1 text-sm shadow-[0_18px_60px_rgba(0,0,0,0.85)]">
              <button
                type="button"
                className={`rounded-full px-6 py-2 transition-colors ${billingMode === "monthly" ? "bg-orange-500 text-black font-medium shadow-[0_0_0_1px_rgba(248,250,252,0.1)]" : "text-neutral-300/80"}`}
                onClick={() => setBillingMode("monthly")}
              >
                Theo tháng
              </button>
              <button
                type="button"
                className={`rounded-full px-6 py-2 transition-colors ${billingMode === "yearly" ? "bg-orange-500 text-black font-medium shadow-[0_0_0_1px_rgba(248,250,252,0.1)]" : "text-neutral-300/80"}`}
                onClick={() => setBillingMode("yearly")}
              >
                <span className="mr-2">Theo năm</span>
                <span className="inline-flex items-center rounded-full bg-orange-500/10 px-2 py-0.5 text-[11px] font-semibold text-orange-400 border border-orange-500/30">
                  Tiết kiệm
                </span>
              </button>
            </div>
          </div>

          {plansError ? (
            <p className="text-center text-sm text-orange-200/90 mb-8">
              {plansError}
            </p>
          ) : null}

          <div className="grid gap-6 md:gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1fr)]">
            {plansLoading ? (
              <>
                <div className="rounded-[32px] bg-neutral-950/70 border border-neutral-800 shadow-[0_26px_80px_rgba(0,0,0,0.9)] px-8 py-10 animate-pulse">
                  <div className="h-5 w-28 bg-white/10 rounded mb-4" />
                  <div className="h-4 w-3/4 bg-white/10 rounded mb-8" />
                  <div className="h-10 w-40 bg-white/10 rounded mb-10" />
                  <div className="h-10 w-full bg-white/10 rounded-full" />
                </div>
                <div className="rounded-[32px] bg-neutral-950/70 border border-neutral-800 shadow-[0_26px_80px_rgba(0,0,0,0.9)] px-8 py-10 animate-pulse">
                  <div className="h-5 w-28 bg-white/10 rounded mb-4" />
                  <div className="h-4 w-3/4 bg-white/10 rounded mb-8" />
                  <div className="h-10 w-40 bg-white/10 rounded mb-10" />
                  <div className="h-10 w-full bg-white/10 rounded-full" />
                </div>
                <div className="rounded-[32px] bg-neutral-950/70 border border-neutral-800 shadow-[0_26px_80px_rgba(0,0,0,0.9)] px-8 py-10 animate-pulse">
                  <div className="h-5 w-28 bg-white/10 rounded mb-4" />
                  <div className="h-4 w-3/4 bg-white/10 rounded mb-8" />
                  <div className="h-10 w-40 bg-white/10 rounded mb-10" />
                  <div className="h-10 w-full bg-white/10 rounded-full" />
                </div>
              </>
            ) : plansToRender.length ? (
              plansToRender.map((plan, idx) => (
                <PricingPlanCard
                  key={plan.subscriptionPlanId}
                  plan={plan}
                  billingMode={billingMode}
                  featured={idx === Math.min(1, plansToRender.length - 1)}
                  onSelect={handleSelectPlan}
                  disabled={checkoutPlanId != null}
                  selecting={checkoutPlanId === plan.subscriptionPlanId}
                />
              ))
            ) : (
              <div className="md:col-span-3 text-center text-sm text-neutral-400">
                Chưa có gói thuê.
              </div>
            )}
          </div>
        </div>
      </section>

      <PortalFooter />
    </main>
  );
}
