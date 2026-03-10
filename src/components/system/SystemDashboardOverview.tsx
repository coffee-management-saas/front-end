"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CreditCard,
  DollarSign,
  Filter,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";

type SystemDashboardMonth = {
  id: number;
  month: string;
  year: number;
  totalRevenue: number;
  totalSubscriptions: number;
  newShops: number;
  returningShops: number;
  totalExpenses: number;
  createdAt?: string;
};

type SystemDashboardResponse = {
  code?: number;
  status?: string;
  message?: string;
  data?: unknown;
};

const DEFAULT_YEAR = new Date().getFullYear();

const MONTH_ORDER: Record<string, number> = {
  JANUARY: 1,
  FEBRUARY: 2,
  MARCH: 3,
  APRIL: 4,
  MAY: 5,
  JUNE: 6,
  JULY: 7,
  AUGUST: 8,
  SEPTEMBER: 9,
  OCTOBER: 10,
  NOVEMBER: 11,
  DECEMBER: 12,
};

const safeNumber = (v: unknown) => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatInteger = (n: number) =>
  Math.round(safeNumber(n)).toLocaleString("vi-VN");

const formatVnd = (amount: number) =>
  `${Math.round(safeNumber(amount)).toLocaleString("vi-VN")} ₫`;

const formatCompactVnd = (amount: number) => {
  const n = safeNumber(amount);
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000_000)
    return `${sign}${(abs / 1_000_000_000).toFixed(1)}B ₫`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M ₫`;
  return `${sign}${Math.round(abs).toLocaleString("vi-VN")} ₫`;
};

const pctChange = (current: number, previous: number) => {
  const curr = safeNumber(current);
  const prev = safeNumber(previous);
  if (prev === 0) return curr === 0 ? 0 : 100;
  return ((curr - prev) / Math.abs(prev)) * 100;
};

const parseDashboardMonths = (raw: unknown): SystemDashboardMonth[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): SystemDashboardMonth | null => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const month = String(obj.month ?? "")
        .trim()
        .toUpperCase();
      const year = Math.floor(safeNumber(obj.year));
      if (!MONTH_ORDER[month] || !year) return null;
      return {
        id: Math.floor(safeNumber(obj.id)),
        month,
        year,
        totalRevenue: safeNumber(obj.totalRevenue),
        totalSubscriptions: safeNumber(obj.totalSubscriptions),
        newShops: safeNumber(obj.newShops),
        returningShops: safeNumber(obj.returningShops),
        totalExpenses: safeNumber(obj.totalExpenses),
        createdAt: typeof obj.createdAt === "string" ? obj.createdAt : undefined,
      };
    })
    .filter((x): x is SystemDashboardMonth => Boolean(x))
    .sort((a, b) => (MONTH_ORDER[a.month] ?? 0) - (MONTH_ORDER[b.month] ?? 0));
};

function DeltaText({ value }: { value: number }) {
  const v = safeNumber(value);
  const cls =
    v > 0 ? "text-emerald-600" : v < 0 ? "text-red-600" : "text-stone-500";
  const prefix = v > 0 ? "+" : "";
  return (
    <span className={cls}>
      {prefix}
      {Math.abs(v).toFixed(1)}% so với tháng trước
    </span>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs text-stone-600">{title}</p>
          <p className="text-2xl font-semibold leading-tight text-stone-900">
            {value}
          </p>
          {subtitle ? <p className="text-xs">{subtitle}</p> : null}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
        {right ? <div className="text-xs text-stone-500">{right}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function SimpleAreaChart({
  values,
  labels,
  color,
  id,
  tooltipLabel,
  formatValue,
}: {
  values: number[];
  labels: string[];
  color: string;
  id: string;
  tooltipLabel: string;
  formatValue: (n: number) => string;
}) {
  const w = 720;
  const h = 260;
  const padX = 18;
  const padY = 14;

  const safeValues = useMemo(() => values.map((v) => Math.max(0, safeNumber(v))), [values]);
  const max = useMemo(() => Math.max(...safeValues, 1), [safeValues]);

  const points = useMemo(() => {
    const innerW = w - padX * 2;
    const innerH = h - padY * 2;
    return safeValues.map((v, i) => {
      const x = safeValues.length === 1 ? w / 2 : padX + (i / (safeValues.length - 1)) * innerW;
      const y = padY + (1 - v / max) * innerH;
      return { x, y, v, label: labels[i] ?? `T${i + 1}` };
    });
  }, [labels, max, padX, padY, safeValues]);

  const linePath = useMemo(() => {
    if (!points.length) return "";
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  }, [points]);

  const areaPath = useMemo(() => {
    if (!linePath || !points.length) return "";
    const first = points[0];
    const last = points[points.length - 1];
    return `${linePath} L ${last.x.toFixed(1)} ${(h - padY).toFixed(1)} L ${first.x.toFixed(1)} ${(h - padY).toFixed(1)} Z`;
  }, [h, linePath, padY, points]);

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-xl border border-stone-200 bg-white">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {areaPath ? <path d={areaPath} fill={`url(#fill-${id})`} /> : null}
        {linePath ? <path d={linePath} fill="none" stroke={color} strokeWidth="2.6" /> : null}
        {points.map((p) => (
          <circle key={p.label} cx={p.x} cy={p.y} r="3.8" fill={color} opacity="0.9">
            <title>
              {p.label} • {tooltipLabel}: {formatValue(p.v)}
            </title>
          </circle>
        ))}
        {points.map((p) => (
          <text key={`x-${p.label}`} x={p.x} y={h - 6} textAnchor="middle" fontSize="11" fill="#78716c">
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

function SimpleBarChart({
  values,
  labels,
  unit,
}: {
  values: number[];
  labels: string[];
  unit: string;
}) {
  const safeValues = useMemo(() => values.map((v) => Math.max(0, safeNumber(v))), [values]);
  const max = useMemo(() => Math.max(...safeValues, 1), [safeValues]);

  return (
    <div className="h-64 rounded-xl border border-amber-900/30 bg-gradient-to-b from-[#2a1a0f] to-[#120a05] p-4">
      <div className="flex h-full items-end gap-2">
        {safeValues.map((v, i) => {
          const pct = (v / max) * 100;
          const label = labels[i] ?? `T${i + 1}`;
          return (
            <div key={label} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-amber-700 to-amber-300 shadow-[0_6px_16px_rgba(0,0,0,0.25)]"
                style={{ height: `${pct}%` }}
                title={`${label} • ${formatInteger(v)}${unit ? ` ${unit}` : ""}`}
              />
              <div className="text-[11px] text-amber-200/90">{label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SimpleLineChart({
  a,
  b,
  labels,
  aLabel,
  bLabel,
}: {
  a: number[];
  b: number[];
  labels: string[];
  aLabel: string;
  bLabel: string;
}) {
  const w = 720;
  const h = 260;
  const pad = 18;
  const max = useMemo(() => Math.max(...[...a, ...b].map((v) => safeNumber(v)), 1), [a, b]);

  const toPath = (values: number[]) => {
    const innerW = w - pad * 2;
    const innerH = h - pad * 2;
    return values
      .map((v, i) => {
        const x = values.length === 1 ? w / 2 : pad + (i / (values.length - 1)) * innerW;
        const y = pad + (1 - safeNumber(v) / max) * innerH;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  };

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-xl border border-stone-200 bg-white">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" preserveAspectRatio="none">
        <path d={toPath(a)} fill="none" stroke="#10b981" strokeWidth="2.2" />
        <path d={toPath(b)} fill="none" stroke="#a855f7" strokeWidth="2.2" />
        {labels.map((l, i) => (
          <text
            key={`${l}-${i}`}
            x={labels.length === 1 ? w / 2 : pad + (i / (labels.length - 1)) * (w - pad * 2)}
            y={h - 6}
            textAnchor="middle"
            fontSize="11"
            fill="#78716c"
          >
            {l}
          </text>
        ))}
      </svg>
      <div className="absolute left-4 top-4 flex items-center gap-4 text-xs text-stone-500">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {aLabel}
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-purple-500" />
          {bLabel}
        </div>
      </div>
    </div>
  );
}

export default function SystemDashboardOverview() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [monthsRaw, setMonthsRaw] = useState<SystemDashboardMonth[]>([]);
  const [year, setYear] = useState(DEFAULT_YEAR);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    (async () => {
      setIsLoading(true);
      setLoadError(null);
      setMonthsRaw([]);

      try {
        const url = `/api/dashboard/system/overview/dashboard?year=${year}`;
        const res = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
          cache: "no-store",
        });

        const json = (await res
          .json()
          .catch(() => null)) as SystemDashboardResponse | null;
        if (!res.ok || !json || Number(json.code) !== 200) {
          throw new Error(json?.message || "Load system dashboard failed");
        }

        const months = parseDashboardMonths(json.data);
        if (mounted) setMonthsRaw(months);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Không thể tải dữ liệu dashboard";
        if (mounted) {
          setLoadError(msg);
          toast.error(msg);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [year]);

  const yearOptions = useMemo(() => {
    const end = DEFAULT_YEAR;
    const start = end - 4;
    const out: number[] = [];
    for (let y = start; y <= end; y += 1) out.push(y);
    return out;
  }, []);

  const series = useMemo(() => {
    const byMonth = new Map<number, SystemDashboardMonth>();
    for (const row of monthsRaw) {
      const idx = MONTH_ORDER[row.month];
      if (idx) byMonth.set(idx, row);
    }

    return Array.from({ length: 12 }, (_, i) => {
      const monthIndex = i + 1;
      const row = byMonth.get(monthIndex);
      return {
        label: `T${monthIndex}`,
        hasRow: Boolean(row),
        revenue: safeNumber(row?.totalRevenue),
        expenses: safeNumber(row?.totalExpenses),
        subscriptions: safeNumber(row?.totalSubscriptions),
        newShops: safeNumber(row?.newShops),
        returningShops: safeNumber(row?.returningShops),
      };
    });
  }, [monthsRaw]);

  const latestMonthIndex = useMemo(() => {
    for (let i = series.length - 1; i >= 0; i -= 1) {
      if (series[i].hasRow) return i;
    }
    for (let i = series.length - 1; i >= 0; i -= 1) {
      if (
        series[i].revenue ||
        series[i].expenses ||
        series[i].subscriptions ||
        series[i].newShops ||
        series[i].returningShops
      ) {
        return i;
      }
    }
    return 0;
  }, [series]);

  const prevMonthIndex = Math.max(0, latestMonthIndex - 1);
  const latest = series[latestMonthIndex];
  const prev = series[prevMonthIndex];

  const totals = useMemo(() => {
    return series.reduce(
      (acc, m) => {
        acc.revenue += m.revenue;
        acc.expenses += m.expenses;
        acc.subscriptions += m.subscriptions;
        acc.shops += m.newShops + m.returningShops;
        return acc;
      },
      { revenue: 0, expenses: 0, subscriptions: 0, shops: 0 },
    );
  }, [series]);

  const revenueDelta = pctChange(latest.revenue, prev.revenue);
  const expensesDelta = pctChange(latest.expenses, prev.expenses);
  const subscriptionsDelta = pctChange(latest.subscriptions, prev.subscriptions);
  const shopsDelta = pctChange(
    latest.newShops + latest.returningShops,
    prev.newShops + prev.returningShops,
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              System Dashboard
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Tổng quan theo tháng của hệ thống
            </p>
          </div>

          <div className="flex items-center justify-start sm:justify-end">
            <label className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs shadow-sm">
              <Filter className="h-4 w-4 text-stone-500" />
              <span className="font-medium text-stone-600">Lọc năm</span>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value) || DEFAULT_YEAR)}
                className="bg-transparent font-semibold text-stone-900 outline-none"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {loadError ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Tổng doanh thu"
            value={isLoading ? "—" : formatCompactVnd(totals.revenue)}
            subtitle={isLoading ? null : <DeltaText value={revenueDelta} />}
            icon={<DollarSign className="h-5 w-5" />}
          />
          <StatCard
            title="Tổng chi phí"
            value={isLoading ? "—" : formatCompactVnd(totals.expenses)}
            subtitle={isLoading ? null : <DeltaText value={expensesDelta} />}
            icon={<TrendingDown className="h-5 w-5" />}
          />
          <StatCard
            title="Gói đăng ký"
            value={isLoading ? "—" : formatInteger(totals.subscriptions)}
            subtitle={
              isLoading ? null : <DeltaText value={subscriptionsDelta} />
            }
            icon={<CreditCard className="h-5 w-5" />}
          />
          <StatCard
            title="Cửa hàng"
            value={isLoading ? "—" : formatInteger(totals.shops)}
            subtitle={isLoading ? null : <DeltaText value={shopsDelta} />}
            icon={<Building2 className="h-5 w-5" />}
          />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card title="Doanh thu theo tháng" right={`Năm ${year}`}>
              {isLoading ? (
                <div className="h-72 animate-pulse rounded-xl bg-stone-100" />
              ) : (
                <SimpleAreaChart
                  values={series.map((m) => m.revenue)}
                  labels={series.map((m) => m.label)}
                  id="revenue"
                  tooltipLabel="Doanh thu"
                  color="#10b981"
                  formatValue={formatVnd}
                />
              )}
            </Card>
          </div>

          <Card title="Chi phí theo tháng" right={`Năm ${year}`}>
            {isLoading ? (
              <div className="h-72 animate-pulse rounded-xl bg-stone-100" />
            ) : (
              <SimpleAreaChart
                values={series.map((m) => m.expenses)}
                labels={series.map((m) => m.label)}
                id="expenses"
                tooltipLabel="Chi phí"
                color="#ef4444"
                formatValue={formatVnd}
              />
            )}
          </Card>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-3">
            <Card title="Subscriptions theo tháng" right={`Năm ${year}`}>
              {isLoading ? (
                <div className="h-64 animate-pulse rounded-xl bg-stone-100" />
              ) : (
                <SimpleBarChart
                  values={series.map((m) => m.subscriptions)}
                  labels={series.map((m) => m.label)}
                  unit="gói"
                />
              )}
            </Card>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-3">
            <Card title="Shop mới vs quay lại" right={`Năm ${year}`}>
              {isLoading ? (
                <div className="h-64 animate-pulse rounded-xl bg-stone-100" />
              ) : (
                <SimpleLineChart
                  a={series.map((m) => m.newShops)}
                  b={series.map((m) => m.returningShops)}
                  labels={series.map((m) => m.label)}
                  aLabel="Shop mới"
                  bLabel="Quay lại"
                />
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
