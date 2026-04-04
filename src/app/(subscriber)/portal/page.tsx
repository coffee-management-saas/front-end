"use client";

import Link from "next/link";
import Script from "next/script";
import { PortalFooter } from "@/components/portal/PortalFooter";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { formatCurrency } from "@/lib/utils";
import React, { useEffect, useMemo, useState } from "react";

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

const CONFIG_LIMIT_VALUE_SUFFIX_VI: Record<string, string> = {
  storage_gb: " GB",
  max_projects: " dự án",
  ai_queries_per_month: " lần",
};

const formatConfigValueVi = (key: string, value: string) => {
  if (
    String(value ?? "")
      .trim()
      .toUpperCase() === "UNLIMITED"
  )
    return "không giới hạn";

  const normalizedKey = normalizeConfigKey(key);
  const suffix = CONFIG_LIMIT_VALUE_SUFFIX_VI[normalizedKey] ?? "";
  if (!suffix) return value;

  const trimmed = String(value ?? "").trim();
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return value;

  // Only append unit for plain numeric values to avoid doubling.
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return value;
  return `${trimmed}${suffix}`;
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

function PricingPlanCard({
  plan,
  billingMode,
  featured,
}: {
  plan: SubscriptionPlan;
  billingMode: "monthly" | "yearly";
  featured?: boolean;
}) {
  const features = Object.entries(plan.configLimit ?? {})
    .filter(([, v]) => String(v ?? "").trim())
    .slice(0, 5)
    .map(([k, v]) => `${formatConfigKeyVi(k)}: ${formatConfigValueVi(k, v)}`);

  const hasPrices =
    Number.isFinite(plan.priceMonthly) && Number.isFinite(plan.priceYearly);

  return (
    <div
      className={[
        "rounded-[32px] border shadow-[0_26px_80px_rgba(0,0,0,0.9)] px-8 py-10 flex flex-col justify-between reveal",
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
                <span className="text-sm text-neutral-400">
                  {billingMode === "monthly" ? "/tháng" : "/năm"}
                </span>
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
                Contact us
              </p>
              <p className="text-xs text-neutral-500">
                Liên hệ với chúng tôi để được hỗ trợ
              </p>
            </>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <Link
          href="/checkout/subscription"
          className={[
            "w-full inline-flex items-center justify-center rounded-full transition-colors px-6 py-3 text-sm",
            featured
              ? "bg-orange-500 hover:bg-orange-400 font-semibold text-black"
              : "bg-neutral-800/80 hover:bg-neutral-700 font-medium text-white",
          ].join(" ")}
        >
          Chọn gói
        </Link>

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

export default function Page() {
  const [billingMode, setBillingMode] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState<boolean>(true);
  const [plansError, setPlansError] = useState<string>("");

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
              message || `Không tải được gói thành viên (${res.status}).`,
            );
          }
          return;
        }

        const parsed = coercePlans(data);
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

      {/* Hero */}
      <section className="relative w-full pt-10 pb-10">
        <div className="absolute inset-0">
          <div className="w-full h-[696px] max-h-[80vh]">
            <div
              data-us-project="98LbxUn5KV3Z8vHICb6u"
              data-scene-id="id-alhsas7ri2bfzixa8mwwf"
              className="w-full h-full"
            />
          </div>

          <Script id="unicornstudio-loader" strategy="afterInteractive">{`
            !function(){
              if(!window.UnicornStudio){
                window.UnicornStudio={isInitialized:!1};
                var i=document.createElement("script");
                i.src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js";
                i.onload=function(){
                  window.UnicornStudio.isInitialized||(window.UnicornStudio.init(),window.UnicornStudio.isInitialized=!0)
                };
                (document.head||document.body).appendChild(i)
              }
            }();
          `}</Script>

          <div className="absolute inset-0 bg-[radial-gradient(55%_65%_at_50%_18%,rgba(245,158,11,0.22),transparent_62%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(45%_55%_at_20%_30%,rgba(124,45,18,0.18),transparent_60%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#120b0a]/35 to-[#0f0a07]/95" />
        </div>

        <div className="relative max-w-7xl mx-auto sm:px-6 lg:px-8 sm:pt-24 px-4">
          <div className="max-w-3xl text-center mx-auto">
            <span className="uppercase text-xs text-amber-100/90 tracking-wider">
              New: Ưu đãi hội viên cà phê
            </span>
            <h1
              className="mt-3 text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-tight"
              style={{
                fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
                fontWeight: 600,
              }}
            >
              FUTURE & BETTER
            </h1>
            <p className="mt-6 text-lg text-gray-300 max-w-xl mx-auto">
              Chúng tôi cung cấp giải pháp thiết kế và cho thuê website hiện
              đại, giúp cửa hàng dễ dàng xây dựng hình ảnh chuyên nghiệp và phát
              triển kinh doanh online.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
              <button
                type="button"
                aria-label="Primary action"
                className="group relative inline-flex items-center gap-2 rounded-3xl px-6 py-3 bg-gradient-to-b from-amber-500/20 to-orange-600/35 text-amber-50 font-medium tracking-tight cursor-pointer outline-none transition-all duration-300 ease-out ring-1 ring-orange-300/10 hover:ring-orange-300/30 hover:shadow-[0_0_0_3px_rgba(251,146,60,0.10)] focus-visible:ring-2 focus-visible:ring-orange-300/50 shadow-[inset_0_0_12px_rgba(255,210,160,0.38)] hover:shadow-[inset_0_0_14px_rgba(255,210,160,0.52)] hover:bg-gradient-to-b hover:from-amber-500/25 hover:to-orange-600/45"
                onClick={() => {
                  const target = document.getElementById("offers");
                  target?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
              >
                <span
                  className="absolute inset-0 rounded-3xl z-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(120,53,15,0) 0%, rgba(120,53,15,0.50) 100%), rgba(245,158,11,0.20)",
                    boxShadow: "inset 0 0 12px rgba(255,210,160,0.38)",
                  }}
                />
                <span
                  className="absolute inset-0 rounded-3xl z-0 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(120,53,15,0) 0%, rgba(120,53,15,0.62) 100%), rgba(245,158,11,0.26)",
                    boxShadow: "inset 0 0 14px rgba(255,210,160,0.52)",
                  }}
                />
                <span
                  className="pointer-events-none absolute inset-0 rounded-3xl z-10"
                  style={{
                    padding: "1px",
                    background:
                      "linear-gradient(180deg, rgba(255,237,213,0.22) 0%, rgba(255,237,213,0) 100%), linear-gradient(0deg, rgba(255,237,213,0.32), rgba(255,237,213,0.32))",
                    WebkitMask:
                      "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    borderRadius: "1.5rem",
                  }}
                />
                <span className="relative z-20 flex items-center gap-2">
                  <span className="text-[15px] leading-none">Nhận ưu đãi</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-amber-100/90 transition-transform duration-300 ease-out group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </span>
              </button>

              <Link
                href="#menu"
                className="inline-flex items-center gap-2 hover:bg-white/10 transition-all text-gray-100 bg-white/5 border-white/10 border rounded-full px-5 py-3 backdrop-blur-lg"
              >
                Tìm hiểu về chúng tôi
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <path d="M8 3h8" />
                  <path d="M7 7h10" />
                  <path d="M8 21h8" />
                  <path d="M12 7v14" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section
        className="md:py-32 text-white bg-black mt-0 mb-0 pt-24 pb-24 relative"
        id="pricing"
      >
        <div className="lg:px-8 max-w-6xl mx-auto px-6">
          <div className="text-center mb-12 md:mb-16 reveal">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-orange-400 mb-3">
              #GÓI THÀNH VIÊN
            </p>
            <h2 className="text-3xl md:text-5xl font-semibold leading-tight text-neutral-50">
              Gói thành viên phù hợp với cửa hàng bạn
            </h2>
            <p className="mt-3 text-sm md:text-base text-neutral-400 max-w-2xl mx-auto">
              Tham gia gói thành viên phù hợp để tận hưởng tích điểm và quà tặng
              theo mùa.
            </p>
          </div>

          {/* Billing toggle */}
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
                  Giảm 30%
                </span>
              </button>
            </div>
          </div>

          {plansError ? (
            <p className="text-center text-sm text-orange-200/90 mb-8">
              {plansError}
            </p>
          ) : null}

          {/* Cards */}
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
                />
              ))
            ) : (
              <div className="md:col-span-3 text-center text-sm text-neutral-400">
                Chưa có gói thành viên.
              </div>
            )}
          </div>
        </div>
      </section>

      <PortalFooter />
    </main>
  );
}
