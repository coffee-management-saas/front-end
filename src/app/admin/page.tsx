"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  Filter,
  Package,
  RefreshCw,
  ShoppingCart,
  Users,
} from "lucide-react";
import { toast } from "sonner";

type ShopDashboardMonth = {
  id: number;
  shopId: number;
  month: string; // e.g. "MARCH"
  year: number;
  totalRevenue: number;
  totalOrders: number;
  totalProduct: number;
  newCustomers: number;
  returningCustomers: number;
  totalOfflineOrders: number;
  totalOnlineOrders: number;
};

type ShopDashboardResponse = {
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

const formatCompactVnd = (amount: number) => {
  const n = safeNumber(amount);
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000_000)
    return `${sign}${(abs / 1_000_000_000).toFixed(1)}B đ`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M đ`;
  return `${sign}${Math.round(abs).toLocaleString("vi-VN")} đ`;
};

const pctChange = (current: number, previous: number) => {
  const curr = safeNumber(current);
  const prev = safeNumber(previous);
  if (prev === 0) return curr === 0 ? 0 : 100;
  return ((curr - prev) / Math.abs(prev)) * 100;
};

const parseDashboardMonths = (raw: unknown): ShopDashboardMonth[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): ShopDashboardMonth | null => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const month = String(obj.month ?? "")
        .trim()
        .toUpperCase();
      const year = Math.floor(safeNumber(obj.year));
      if (!MONTH_ORDER[month] || !year) return null;
      return {
        id: Math.floor(safeNumber(obj.id)),
        shopId: Math.floor(safeNumber(obj.shopId)),
        month,
        year,
        totalRevenue: safeNumber(obj.totalRevenue),
        totalOrders: safeNumber(obj.totalOrders),
        totalProduct: safeNumber(obj.totalProduct),
        newCustomers: safeNumber(obj.newCustomers),
        returningCustomers: safeNumber(obj.returningCustomers),
        totalOfflineOrders: safeNumber(obj.totalOfflineOrders),
        totalOnlineOrders: safeNumber(obj.totalOnlineOrders),
      };
    })
    .filter((x): x is ShopDashboardMonth => Boolean(x))
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

function AreaChart({ values, labels }: { values: number[]; labels: string[] }) {
  const width = 760;
  const height = 300;
  const padTop = 16;
  const padBottom = 28;
  const padLeft = 46;
  const padRight = 18;

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { yMax, ticks } = useMemo(() => {
    const desiredMaxTicks = 5;
    const maxValue = Math.max(...values.map((v) => safeNumber(v)), 0);

    const niceNum = (range: number, round: boolean) => {
      if (range <= 0) return 1;
      const exponent = Math.floor(Math.log10(range));
      const fraction = range / 10 ** exponent;
      let niceFraction = 1;

      if (round) {
        if (fraction < 1.5) niceFraction = 1;
        else if (fraction < 3) niceFraction = 2;
        else if (fraction < 7) niceFraction = 5;
        else niceFraction = 10;
      } else {
        if (fraction <= 1) niceFraction = 1;
        else if (fraction <= 2) niceFraction = 2;
        else if (fraction <= 5) niceFraction = 5;
        else niceFraction = 10;
      }

      return niceFraction * 10 ** exponent;
    };

    const buildTicks = (step: number, max: number) => {
      const out: number[] = [];
      for (let v = 0; v <= max + step / 10; v += step) out.push(v);
      return out;
    };

    const targetTicks = 5;
    const minYMax = 60_000;

    if (maxValue <= 0) {
      const step = 15_000;
      const max = minYMax;
      return { yMax: max, ticks: buildTicks(step, max) };
    }

    const range = niceNum(maxValue, false);
    let step = niceNum(range / (targetTicks - 1), true);
    if (step <= 0) step = 1;

    let max = Math.max(minYMax, Math.ceil(maxValue / step) * step);
    let t = buildTicks(step, max);

    while (t.length > desiredMaxTicks) {
      step = niceNum(step * 2, true);
      max = Math.max(minYMax, Math.ceil(maxValue / step) * step);
      t = buildTicks(step, max);
    }

    return { yMax: max, ticks: t };
  }, [values]);

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;
  const xStep = values.length > 1 ? chartW / (values.length - 1) : 0;

  const points = useMemo(() => {
    return values.map((v, i) => {
      const x =
        values.length === 1 ? padLeft + chartW / 2 : padLeft + i * xStep;
      const y = padTop + (1 - safeNumber(v) / yMax) * chartH;
      return { x, y };
    });
  }, [values, chartH, chartW, padLeft, padTop, xStep, yMax]);

  const smoothPath = useMemo(() => {
    if (points.length === 0) return "";
    if (points.length === 1)
      return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

    const path: string[] = [
      `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`,
    ];
    for (let i = 0; i < points.length - 1; i += 1) {
      const p0 = points[i - 1] ?? points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] ?? p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path.push(
        `C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
      );
    }
    return path.join(" ");
  }, [points]);

  const baseY = height - padBottom;
  const areaPath = useMemo(() => {
    if (!smoothPath || points.length === 0) return "";
    const first = points[0];
    const last = points[points.length - 1];
    return `${smoothPath} L ${last.x.toFixed(1)} ${baseY.toFixed(1)} L ${first.x.toFixed(1)} ${baseY.toFixed(1)} Z`;
  }, [baseY, points, smoothPath]);

  const formatTick = (t: number) => {
    if (t <= 0) return "0k";
    if (t >= 1_000_000) {
      const m = t / 1_000_000;
      return `${Number.isInteger(m) ? m.toFixed(0) : m.toFixed(1)}M`;
    }
    return `${Math.round(t / 1000)}k`;
  };

  const hoverPoint = hoverIndex != null ? points[hoverIndex] : null;
  const hoverLabel = hoverIndex != null ? labels[hoverIndex] : "";
  const hoverValue = hoverIndex != null ? values[hoverIndex] : 0;

  const tooltipFlip =
    hoverIndex != null &&
    values.length > 0 &&
    hoverIndex > values.length * 0.65;

  return (
    <div
      className="relative h-72 w-full overflow-hidden rounded-xl border border-stone-200 bg-white"
      onMouseLeave={() => setHoverIndex(null)}
    >
      {hoverPoint ? (
        <div
          className="pointer-events-none absolute z-20"
          style={{
            left: `${(hoverPoint.x / width) * 100}%`,
            top: `${(hoverPoint.y / height) * 100}%`,
            transform: tooltipFlip
              ? "translate(calc(-100% - 18px), -50%)"
              : "translate(18px, -50%)",
          }}
        >
          <div className="w-56 rounded-2xl border border-stone-200 bg-white p-4 shadow-lg">
            <div className="text-sm font-medium text-stone-700">
              {hoverLabel}
            </div>
            <div className="mt-1 text-sm font-semibold text-emerald-600">
              Doanh thu :{" "}
              {Math.round(safeNumber(hoverValue)).toLocaleString("vi-VN")}đ
            </div>
          </div>
        </div>
      ) : null}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="Doanh thu theo tháng"
        onMouseMove={(e) => {
          if (values.length === 0) return;
          const rect = (
            e.currentTarget as SVGSVGElement
          ).getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * width;
          const idx =
            values.length === 1
              ? 0
              : Math.min(
                  values.length - 1,
                  Math.max(0, Math.round((x - padLeft) / xStep)),
                );
          setHoverIndex(idx);
        }}
      >
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* grid vertical */}
        {labels.map((_, i) => {
          const x =
            values.length === 1 ? padLeft + chartW / 2 : padLeft + i * xStep;
          return (
            <line
              key={`vx-${i}`}
              x1={x}
              x2={x}
              y1={padTop}
              y2={baseY}
              stroke="#e7e5e4"
              strokeDasharray="4 4"
            />
          );
        })}
        {/* grid horizontal + y labels */}
        {ticks.map((t) => {
          const y = padTop + (1 - t / yMax) * chartH;
          return (
            <g key={`hy-${t}`}>
              <line
                x1={padLeft}
                x2={width - padRight}
                y1={y}
                y2={y}
                stroke="#e7e5e4"
                strokeDasharray="4 4"
              />
              <text
                x={padLeft - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="12"
                fill="#78716c"
              >
                {formatTick(t)}
              </text>
            </g>
          );
        })}

        {/* hover crosshair */}
        {hoverPoint ? (
          <line
            x1={hoverPoint.x}
            x2={hoverPoint.x}
            y1={padTop}
            y2={baseY}
            stroke="#d6d3d1"
            strokeWidth="1.5"
          />
        ) : null}

        {/* area + line */}
        {areaPath ? <path d={areaPath} fill="url(#areaFill)" /> : null}
        {smoothPath ? (
          <path d={smoothPath} fill="none" stroke="#10b981" strokeWidth="2.6" />
        ) : null}

        {/* hover dot */}
        {hoverPoint ? (
          <circle
            cx={hoverPoint.x}
            cy={hoverPoint.y}
            r="5.5"
            fill="#10b981"
            stroke="#ffffff"
            strokeWidth="3"
          />
        ) : null}

        {/* x labels */}
        {labels.map((l, i) => {
          const x =
            values.length === 1 ? padLeft + chartW / 2 : padLeft + i * xStep;
          return (
            <text
              key={`xl-${l}`}
              x={x}
              y={height - 6}
              textAnchor="middle"
              fontSize="12"
              fill="#78716c"
            >
              {l}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function BarChart({
  values,
  labels,
  showBars = false,
}: {
  values: number[];
  labels: string[];
  showBars?: boolean;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const Y_STEPS = 8;

  const width = 760;
  const height = 300;
  const padTop = 18;
  const padBottom = 46;
  const padLeft = 44;
  const padRight = 16;

  const safeValues = useMemo(() => values.map((v) => safeNumber(v)), [values]);
  const maxRaw = useMemo(() => Math.max(...safeValues, 1), [safeValues]);

  const yMax = useMemo(() => {
    const step = Math.max(1, Math.ceil(maxRaw / Y_STEPS));
    return step * Y_STEPS;
  }, [Y_STEPS, maxRaw]);

  const ticks = useMemo(() => {
    const step = Math.max(1, Math.ceil(yMax / Y_STEPS));
    const out: number[] = [];
    for (let i = 0; i <= Y_STEPS; i += 1) out.push(i * step);
    return out;
  }, [Y_STEPS, yMax]);

  const avg = useMemo(() => {
    if (!safeValues.length) return 0;
    return (
      safeValues.reduce((a, b) => a + safeNumber(b), 0) / safeValues.length
    );
  }, [safeValues]);

  if (!safeValues.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-stone-200 bg-white text-sm text-stone-500">
        Không có dữ liệu
      </div>
    );
  }

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;
  const groupW = chartW / safeValues.length;
  const baseY = padTop + chartH;

  const barW = Math.max(8, Math.min(16, Math.floor(groupW * 0.24)));

  const points = safeValues.map((v, i) => {
    const x = padLeft + (i + 0.5) * groupW;
    const y = padTop + (1 - safeNumber(v) / (yMax || 1)) * chartH;
    return { x, y, v: safeNumber(v), label: labels[i] ?? `T${i + 1}` };
  });

  const minIndex = (() => {
    if (!points.length) return -1;
    let idx = 0;
    let min = points[0].v;
    for (let i = 1; i < points.length; i += 1) {
      if (points[i].v < min) {
        min = points[i].v;
        idx = i;
      }
    }
    return idx;
  })();

  const linePath = (() => {
    if (points.length === 1) {
      const p = points[0];
      return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    }
    if (points.length === 2) {
      return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
    }

    const smooth = 0.25; // smaller => tighter corners (closer to sample)
    const out: string[] = [];
    out.push(`M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`);

    for (let i = 0; i < points.length - 1; i += 1) {
      const p0 = points[i - 1] ?? points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] ?? p2;

      const c1x = p1.x + (p2.x - p0.x) * smooth;
      const c1y = p1.y + (p2.y - p0.y) * smooth;
      const c2x = p2.x - (p3.x - p1.x) * smooth;
      const c2y = p2.y - (p3.y - p1.y) * smooth;

      out.push(
        `C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
      );
    }

    return out.join(" ");
  })();

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const tooltipLeft = hovered ? (hovered.x / width) * 100 : 50;
  const tooltipTop = hovered ? (hovered.y / height) * 100 : 0;
  const clampPct = (v: number, min: number, maxV: number) =>
    Math.max(min, Math.min(maxV, v));

  const avgY = padTop + (1 - safeNumber(avg) / (yMax || 1)) * chartH;
  const avgLabel = formatInteger(Math.round(avg));

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-xl border border-[#5b3a12] bg-gradient-to-b from-[#2a1a0f] to-[#120a05]">
      {hovered ? (
        <div
          className="pointer-events-none absolute z-10 rounded-2xl border border-[#6b4a1a] bg-[#1a0f08]/95 px-3 py-2 text-xs text-[#e7d4ad] shadow-2xl"
          style={{
            left: `${clampPct(tooltipLeft, 12, 88)}%`,
            top: `${clampPct(tooltipTop, 12, 76)}%`,
            transform: "translate(-50%, -120%)",
          }}
        >
          <div className="font-semibold text-[#d2a85a]">{hovered.label}</div>
          <div className="mt-0.5">
            <span className="text-[#f6d15c] font-semibold">
              {formatInteger(hovered.v)}
            </span>{" "}
            đơn
          </div>
        </div>
      ) : null}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="ordersBar" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f6d15c" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#b0783c" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="ordersLine" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f6d15c" stopOpacity="1" />
            <stop offset="100%" stopColor="#c58a45" stopOpacity="0.95" />
          </linearGradient>
          <filter
            id="ordersShadow"
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="2"
              floodColor="#000000"
              floodOpacity="0.35"
            />
          </filter>
          <filter id="goldGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="2.2"
              floodColor="#d2a85a"
              floodOpacity="0.45"
            />
          </filter>
          <filter id="redGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="3"
              floodColor="#fb7185"
              floodOpacity="0.5"
            />
          </filter>
        </defs>

        {/* grid + y labels */}
        {ticks.map((t) => {
          const y = padTop + (1 - t / (yMax || 1)) * chartH;
          return (
            <g key={t}>
              <line
                x1={padLeft}
                x2={width - padRight}
                y1={y}
                y2={y}
                stroke="#6b4a1a"
                strokeDasharray="4 6"
                opacity="0.35"
              />
              <text
                x={padLeft - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#9a7b3a"
                opacity="0.85"
              >
                {t}
              </text>
            </g>
          );
        })}

        {/* average dashed line */}
        <line
          x1={padLeft}
          x2={width - padRight}
          y1={avgY}
          y2={avgY}
          stroke="#fb7185"
          strokeDasharray="6 6"
          opacity="0.85"
        />
        <text
          x={width - padRight + 8}
          y={avgY + 4}
          fontSize="11"
          fill="#fb7185"
          opacity="0.95"
        >
          TB: {avgLabel}
        </text>

        {/* bars */}
        {showBars
          ? points.map((p, idx) => {
              const h = baseY - p.y;
              const x = p.x - barW / 2;
              const active = hoverIndex === idx;
              return (
                <rect
                  key={`b-${p.label}`}
                  x={x}
                  y={p.y}
                  width={barW}
                  height={Math.max(1, h)}
                  rx={6}
                  fill="url(#ordersBar)"
                  opacity={active ? 1 : 0.78}
                  filter="url(#ordersShadow)"
                />
              );
            })
          : null}

        {/* line */}
        <path
          d={linePath}
          fill="none"
          stroke="url(#ordersLine)"
          strokeWidth="2.4"
          strokeLinecap="round"
          filter="url(#goldGlow)"
        />

        {/* points */}
        {points.map((p, idx) => {
          const active = hoverIndex === idx;
          const isMin = idx === minIndex;
          return (
            <circle
              key={`p-${p.label}`}
              cx={p.x}
              cy={p.y}
              r={active ? 6.2 : isMin ? 6.6 : 5.4}
              fill={isMin ? "#fb7185" : "#f6d15c"}
              stroke="#120a05"
              strokeWidth={isMin ? "3" : "2.5"}
              filter={isMin ? "url(#redGlow)" : "url(#goldGlow)"}
            />
          );
        })}

        {/* x labels + hover zones */}
        {points.map((p, idx) => {
          const groupX = padLeft + idx * groupW;
          return (
            <g key={`x-${p.label}`}>
              <rect
                x={groupX}
                y={padTop}
                width={groupW}
                height={chartH}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
              />
              <text
                x={p.x}
                y={height - 14}
                textAnchor="middle"
                fontSize="11"
                fill="#9a7b3a"
                opacity="0.9"
              >
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function LineChart({
  a,
  b,
  labels,
}: {
  a: number[];
  b: number[];
  labels: string[];
}) {
  const width = 720;
  const height = 260;
  const pad = 22;
  const max = Math.max(...[...a, ...b].map((v) => safeNumber(v)), 1);

  const toPath = (values: number[]) => {
    const w = width - pad * 2;
    const h = height - pad * 2;
    return values
      .map((v, i) => {
        const x =
          values.length === 1 ? width / 2 : pad + (i / (values.length - 1)) * w;
        const y = pad + (1 - safeNumber(v) / max) * h;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  };

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-xl border border-stone-200 bg-white">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
        preserveAspectRatio="none"
      >
        <path d={toPath(a)} fill="none" stroke="#10b981" strokeWidth="2.2" />
        <path d={toPath(b)} fill="none" stroke="#a855f7" strokeWidth="2.2" />
        {labels.map((l, i) => (
          <text
            key={l}
            x={
              labels.length === 1
                ? width / 2
                : pad + (i / (labels.length - 1)) * (width - pad * 2)
            }
            y={height - 6}
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
          Khách mới
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-purple-500" />
          Quay lại
        </div>
      </div>
    </div>
  );
}

function DonutChart({ offline, online }: { offline: number; online: number }) {
  const a = Math.max(0, Math.round(safeNumber(offline)));
  const b = Math.max(0, Math.round(safeNumber(online)));
  const total = a + b || 1;
  const radius = 56;
  const stroke = 16;
  const c = 2 * Math.PI * radius;
  const aLen = (a / total) * c;
  const bLen = (b / total) * c;

  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="relative">
        <svg width="160" height="160" viewBox="0 0 160 160" role="img">
          <g transform="translate(80 80) rotate(-90)">
            <circle
              r={radius}
              cx="0"
              cy="0"
              fill="transparent"
              stroke="#e7e5e4"
              strokeWidth={stroke}
            />
            <circle
              r={radius}
              cx="0"
              cy="0"
              fill="transparent"
              stroke="#10b981"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${aLen} ${c - aLen}`}
            />
            <circle
              r={radius}
              cx="0"
              cy="0"
              fill="transparent"
              stroke="#0ea5e9"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${bLen} ${c - bLen}`}
              strokeDashoffset={-aLen}
            />
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-semibold text-stone-900">
            {formatInteger(a + b)}
          </div>
          <div className="text-xs text-stone-500">đơn</div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-stone-600">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Offline ({formatInteger(a)})
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-sky-500" />
          Online ({formatInteger(b)})
        </div>
      </div>
    </div>
  );
}

type TopProductRow = {
  id: number;
  shopId: number;
  productId: number;
  productName: string;
  quantitySold: number;
  month?: string;
  year?: number;
};

const TOP_PRODUCTS_NUM = 5;

const parseTopProducts = (raw: unknown): TopProductRow[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): TopProductRow | null => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const productId = Math.floor(safeNumber(obj.productId));
      const productName = String(obj.productName ?? "").trim();
      const quantitySold = safeNumber(obj.quantitySold);
      if (!productId || !productName) return null;
      return {
        id: Math.floor(safeNumber(obj.id)),
        shopId: Math.floor(safeNumber(obj.shopId)),
        productId,
        productName,
        quantitySold,
        month: String(obj.month ?? "").trim(),
        year: Math.floor(safeNumber(obj.year)),
      };
    })
    .filter((x): x is TopProductRow => Boolean(x));
};

const TOP_PRODUCT_COLORS = [
  "#60a5fa",
  "#34d399",
  "#a78bfa",
  "#fb923c",
  "#fbbf24",
];

type TopProductsMonthlyModel = {
  products: { productId: number; name: string; color: string }[];
  valuesByMonth: number[][]; // 12 x products.length
};

const buildTopProductsMonthlyModel = (
  rows: TopProductRow[],
  limit: number,
): TopProductsMonthlyModel => {
  const totalsByProductId = new Map<number, { name: string; total: number }>();
  for (const row of rows) {
    const current = totalsByProductId.get(row.productId);
    const qty = safeNumber(row.quantitySold);
    if (current) {
      current.total += qty;
    } else {
      totalsByProductId.set(row.productId, {
        name: row.productName,
        total: qty,
      });
    }
  }

  const topProducts = Array.from(totalsByProductId.entries())
    .sort((a, b) => safeNumber(b[1].total) - safeNumber(a[1].total))
    .slice(0, Math.max(1, Math.floor(limit)))
    .map(([productId, meta], idx) => ({
      productId,
      name: meta.name,
      color: TOP_PRODUCT_COLORS[idx % TOP_PRODUCT_COLORS.length],
    }));

  const indexByProductId = new Map<number, number>();
  topProducts.forEach((p, idx) => indexByProductId.set(p.productId, idx));

  const valuesByMonth = Array.from({ length: 12 }, () =>
    Array.from({ length: topProducts.length }, () => 0),
  );

  for (const row of rows) {
    const m =
      MONTH_ORDER[
        String(row.month ?? "")
          .trim()
          .toUpperCase()
      ] ?? 0;
    if (!m) continue;
    const idx = indexByProductId.get(row.productId);
    if (idx === undefined) continue;
    valuesByMonth[m - 1][idx] += safeNumber(row.quantitySold);
  }

  return { products: topProducts, valuesByMonth };
};

function TopProductsMonthlyChart({
  model,
}: {
  model: TopProductsMonthlyModel;
}) {
  const width = 820;
  const height = 360;
  const padTop = 22;
  const padBottom = 54;
  const padLeft = 46;
  const padRight = 18;

  const [hoverMonthIndex, setHoverMonthIndex] = useState<number | null>(null);

  const max = useMemo(() => {
    const values = model.valuesByMonth.flat();
    return Math.max(...values.map((v) => safeNumber(v)), 1);
  }, [model.valuesByMonth]);

  const ticks = useMemo(() => {
    const steps = 4;
    const step = Math.max(1, Math.ceil(max / steps));
    const out: number[] = [];
    for (let i = 0; i <= steps; i += 1) out.push(i * step);
    return out;
  }, [max]);

  if (!model.products.length) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-2xl border border-[#5b3a12] bg-gradient-to-b from-[#2a1a0f] to-[#120a05] text-sm text-[#e7d4ad]/70">
        Không có dữ liệu
      </div>
    );
  }

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;
  const groupW = chartW / 12;

  const barGap = 3;
  const barW = Math.max(
    2,
    Math.min(6, Math.floor((groupW - 10) / Math.max(1, model.products.length))),
  );
  const groupBarsW =
    model.products.length * barW +
    Math.max(0, model.products.length - 1) * barGap;

  const hoveredValues =
    hoverMonthIndex === null
      ? null
      : (model.valuesByMonth[hoverMonthIndex] ?? null);

  const hoveredTotal = hoveredValues
    ? hoveredValues.reduce((acc, v) => acc + safeNumber(v), 0)
    : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#5b3a12] bg-gradient-to-b from-[#2a1a0f] to-[#120a05] p-4 shadow-sm">
      <div className="relative h-[240px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-full w-full"
          preserveAspectRatio="none"
        >
          {ticks.map((t) => {
            const y =
              padTop + (1 - t / (ticks[ticks.length - 1] || 1)) * chartH;
            return (
              <g key={t}>
                <line
                  x1={padLeft}
                  x2={width - padRight}
                  y1={y}
                  y2={y}
                  stroke="#6b4a1a"
                  strokeDasharray="4 6"
                  opacity="0.35"
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#9a7b3a"
                  opacity="0.8"
                >
                  {t}
                </text>
              </g>
            );
          })}

          {hoverMonthIndex !== null ? (
            <rect
              x={padLeft + hoverMonthIndex * groupW}
              y={padTop}
              width={groupW}
              height={chartH}
              fill="#d2a85a"
              opacity="0.06"
            />
          ) : null}

          {Array.from({ length: 12 }, (_, mi) => {
            const monthValues = model.valuesByMonth[mi] ?? [];
            const groupX = padLeft + mi * groupW;
            const startX = groupX + (groupW - groupBarsW) / 2;

            return (
              <g key={mi}>
                <rect
                  x={groupX}
                  y={padTop}
                  width={groupW}
                  height={chartH}
                  fill="transparent"
                  onMouseEnter={() => setHoverMonthIndex(mi)}
                  onMouseLeave={() => setHoverMonthIndex(null)}
                />

                {model.products.map((p, pi) => {
                  const v = safeNumber(monthValues[pi]);
                  const h = (v / (ticks[ticks.length - 1] || 1)) * chartH;
                  const x = startX + pi * (barW + barGap);
                  const y = padTop + (chartH - h);
                  return (
                    <rect
                      key={`${mi}-${p.productId}`}
                      x={x}
                      y={y}
                      width={barW}
                      height={Math.max(2, h)}
                      rx={2}
                      fill={p.color}
                      opacity={v > 0 ? 0.95 : 0.25}
                    />
                  );
                })}

                <text
                  x={groupX + groupW / 2}
                  y={height - 18}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#9a7b3a"
                  opacity="0.85"
                >
                  T{mi + 1}
                </text>
              </g>
            );
          })}
        </svg>

        {hoverMonthIndex !== null && hoveredValues ? (
          <div className="pointer-events-none absolute left-1/2 top-1/2 w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#6b4a1a] bg-[#1a0f08]/95 p-4 text-[#e7d4ad] shadow-2xl">
            <div className="text-lg font-semibold text-[#d2a85a]">
              Tháng {hoverMonthIndex + 1}
            </div>
            <div className="mt-3 space-y-2 text-sm">
              {model.products.map((p, idx) => (
                <div key={p.productId} className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: p.color }}
                  />
                  <div className="flex-1 truncate" title={p.name}>
                    {p.name}
                  </div>
                  <div
                    className="w-10 text-right font-semibold"
                    style={{ color: p.color }}
                  >
                    {formatInteger(hoveredValues[idx] ?? 0)}
                  </div>
                </div>
              ))}
              <div className="mt-3 border-t border-[#6b4a1a]/60 pt-3 flex items-center justify-between">
                <div className="text-[#9a7b3a]">Tổng</div>
                <div className="font-semibold text-[#d2a85a]">
                  {formatInteger(hoveredTotal)}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
        {model.products.map((p) => (
          <div
            key={p.productId}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#6b4a1a]/70 bg-[#1a0f08]/70 px-3 py-1 text-xs text-[#e7d4ad]"
            title={p.name}
          >
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: p.color }}
            />
            <span className="max-w-[140px] truncate">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [monthsRaw, setMonthsRaw] = useState<ShopDashboardMonth[]>([]);
  const [topProductsRaw, setTopProductsRaw] = useState<TopProductRow[]>([]);
  const [topProductsError, setTopProductsError] = useState<string | null>(null);
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    (async () => {
      setIsLoading(true);
      setLoadError(null);
      setTopProductsError(null);
      setMonthsRaw([]);
      setTopProductsRaw([]);

      const fetchMonths = async () => {
        const url = `/api/dashboard/shop/overview/dashboard?year=${year}`;
        const res = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
          cache: "no-store",
        });

        const json = (await res
          .json()
          .catch(() => null)) as ShopDashboardResponse | null;
        if (!res.ok || !json || Number(json.code) !== 200) {
          throw new Error(json?.message || "Load dashboard failed");
        }

        return parseDashboardMonths(json.data);
      };

      const fetchTopProducts = async () => {
        const url = `/api/dashboard/shop/overview/top-products?year=${year}&productNum=${TOP_PRODUCTS_NUM}`;
        const res = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
          cache: "no-store",
        });

        const json = (await res
          .json()
          .catch(() => null)) as ShopDashboardResponse | null;
        if (!res.ok || !json || Number(json.code) !== 200) {
          throw new Error(json?.message || "Load top-products failed");
        }

        return parseTopProducts(json.data);
      };

      try {
        const [monthsResult, topResult] = await Promise.allSettled([
          fetchMonths(),
          fetchTopProducts(),
        ]);

        if (!mounted) return;

        if (monthsResult.status === "fulfilled") {
          setMonthsRaw(monthsResult.value);
        } else {
          const msg =
            monthsResult.reason instanceof Error
              ? monthsResult.reason.message
              : "Không thể tải dữ liệu dashboard";
          setLoadError(msg);
          toast.error(msg);
        }

        if (topResult.status === "fulfilled") {
          setTopProductsRaw(topResult.value);
        } else {
          const msg =
            topResult.reason instanceof Error
              ? topResult.reason.message
              : "Không thể tải dữ liệu top sản phẩm";
          setTopProductsError(msg);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [year, reloadKey]);

  const handleTriggerRefresh = async () => {
    if (isTriggering) return;

    setIsTriggering(true);
    try {
      const res = await fetch("/api/dashboard/shop/overview/trigger", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      const json = (await res
        .json()
        .catch(() => null)) as ShopDashboardResponse | null;

      if (!res.ok || (json?.code != null && Number(json.code) >= 400)) {
        throw new Error(json?.message || "Không thể đồng bộ dashboard");
      }

      toast.success("Đã đồng bộ thành công");
      setReloadKey((value) => value + 1);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể đồng bộ dashboard";
      toast.error(message);
    } finally {
      setIsTriggering(false);
    }
  };

  const yearOptions = useMemo(() => {
    const end = DEFAULT_YEAR;
    const start = end - 4;
    const out: number[] = [];
    for (let y = start; y <= end; y += 1) out.push(y);
    return out;
  }, []);

  const series = useMemo(() => {
    const byMonth = new Map<number, ShopDashboardMonth>();
    for (const row of monthsRaw) {
      const idx = MONTH_ORDER[row.month];
      if (idx) byMonth.set(idx, row);
    }

    return Array.from({ length: 12 }, (_, i) => {
      const monthIndex = i + 1;
      const row = byMonth.get(monthIndex);
      return {
        label: `T${monthIndex}`,
        revenue: safeNumber(row?.totalRevenue),
        orders: safeNumber(row?.totalOrders),
        products: safeNumber(row?.totalProduct),
        newCustomers: safeNumber(row?.newCustomers),
        returningCustomers: safeNumber(row?.returningCustomers),
        offlineOrders: safeNumber(row?.totalOfflineOrders),
        onlineOrders: safeNumber(row?.totalOnlineOrders),
      };
    });
  }, [monthsRaw]);

  const topProductsModel = useMemo(
    () => buildTopProductsMonthlyModel(topProductsRaw, TOP_PRODUCTS_NUM),
    [topProductsRaw],
  );

  const latestMonthIndex = useMemo(() => {
    for (let i = series.length - 1; i >= 0; i -= 1) {
      if (
        series[i].revenue ||
        series[i].orders ||
        series[i].products ||
        series[i].newCustomers ||
        series[i].returningCustomers
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
        acc.orders += m.orders;
        acc.products += m.products;
        acc.customers += m.newCustomers + m.returningCustomers;
        return acc;
      },
      { revenue: 0, orders: 0, products: 0, customers: 0 },
    );
  }, [series]);

  const revenueDelta = pctChange(latest.revenue, prev.revenue);
  const ordersDelta = pctChange(latest.orders, prev.orders);
  const customersDelta = pctChange(
    latest.newCustomers + latest.returningCustomers,
    prev.newCustomers + prev.returningCustomers,
  );
  const productsDelta = Math.round(latest.products - prev.products);

  return (
    <div className="min-h-screen ">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-1 text-sm text-stone-500">
              Tổng quan hoạt động kinh doanh của bạn
            </p>
          </div>

          <div className="flex items-center justify-start gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => void handleTriggerRefresh()}
              disabled={isTriggering}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${isTriggering ? "animate-spin" : ""}`}
              />
              <span>{isTriggering ? "Đang đồng bộ..." : "Đồng bộ"}</span>
            </button>
            <label className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs shadow-sm">
              <Filter className="h-4 w-4 text-stone-500" />
              <span className="font-medium text-stone-600">Lọc năm</span>
              <select
                value={year}
                onChange={(e) =>
                  setYear(Number(e.target.value) || DEFAULT_YEAR)
                }
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
            title="Khách hàng"
            value={isLoading ? "—" : formatInteger(totals.customers)}
            subtitle={isLoading ? null : <DeltaText value={customersDelta} />}
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            title="Đơn hàng"
            value={isLoading ? "—" : formatInteger(totals.orders)}
            subtitle={isLoading ? null : <DeltaText value={ordersDelta} />}
            icon={<ShoppingCart className="h-5 w-5" />}
          />
          <StatCard
            title="Sản phẩm"
            value={isLoading ? "—" : formatInteger(totals.products)}
            subtitle={
              isLoading ? null : (
                <span className="text-stone-500">
                  {productsDelta >= 0 ? "+" : ""}
                  {productsDelta} sản phẩm so với tháng trước
                </span>
              )
            }
            icon={<Package className="h-5 w-5" />}
          />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card title="Doanh thu theo tháng" right={`Năm ${year}`}>
              {isLoading ? (
                <div className="h-72 animate-pulse rounded-xl bg-stone-100" />
              ) : (
                <AreaChart
                  values={series.map((m) => m.revenue)}
                  labels={series.map((m) => m.label)}
                />
              )}
            </Card>
          </div>

          <Card title="Trạng thái đơn hàng" right="Offline vs Online">
            {isLoading ? (
              <div className="h-72 animate-pulse rounded-xl bg-stone-100" />
            ) : (
              <DonutChart
                offline={latest.offlineOrders}
                online={latest.onlineOrders}
              />
            )}
          </Card>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-3">
            <Card
              title="Top sản phẩm bán chạy"
              right={`Top ${TOP_PRODUCTS_NUM} • Năm ${year}`}
            >
              {isLoading ? (
                <div className="h-72 animate-pulse rounded-xl bg-stone-100" />
              ) : topProductsError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {topProductsError}
                </div>
              ) : (
                <TopProductsMonthlyChart model={topProductsModel} />
              )}
              <p className="mt-3 text-xs text-stone-500">
                Dữ liệu theo số lượng bán ra (quantitySold).
              </p>
            </Card>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-3">
            <Card title="Đơn hàng theo tháng" right={`Năm ${year}`}>
              {isLoading ? (
                <div className="h-64 animate-pulse rounded-xl bg-stone-100" />
              ) : (
                <BarChart
                  values={series.map((m) => m.orders)}
                  labels={series.map((m) => m.label)}
                />
              )}
            </Card>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-3">
            <Card title="Khách hàng mới vs quay lại" right={`Năm ${year}`}>
              {isLoading ? (
                <div className="h-64 animate-pulse rounded-xl bg-stone-100" />
              ) : (
                <LineChart
                  a={series.map((m) => m.newCustomers)}
                  b={series.map((m) => m.returningCustomers)}
                  labels={series.map((m) => m.label)}
                />
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
