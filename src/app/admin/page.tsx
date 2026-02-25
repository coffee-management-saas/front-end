"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Coffee,
  DollarSign,
  Percent,
  ShoppingCart,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type ShopOverviewResponse = {
  code?: number;
  status?: string;
  message?: string;
  data?: {
    totalRevenue?: number;
    totalOrders?: number;
    usingPromotionRate?: number;
    topProducts?: unknown[];
  };
};

type TopProduct = {
  name: string;
  qty: number;
  revenue: number;
};

const toVnd = (amount: number) =>
  `${Math.round(Number(amount ?? 0)).toLocaleString("vi-VN")}đ`;

const safeNumber = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : Number(v ?? 0) || 0;

const asTopProduct = (raw: unknown): TopProduct | null => {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  const name = String(
    obj.name ?? obj.productName ?? obj.title ?? obj.itemName ?? "",
  ).trim();
  const qty = safeNumber(obj.qty ?? obj.quantity ?? obj.totalSold ?? obj.sold);
  const revenue = safeNumber(obj.revenue ?? obj.totalRevenue ?? obj.amount);

  if (!name) return null;
  return { name, qty, revenue };
};

export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [overview, setOverview] = useState<ShopOverviewResponse["data"] | null>(
    null,
  );

  const defaultTopProductsLimit = 5;
  const defaultToDate = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const defaultFromDate = useMemo(
    () => format(subDays(new Date(), 1), "yyyy-MM-dd"),
    [],
  );

  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);
  const [draftFromDate, setDraftFromDate] = useState(defaultFromDate);
  const [draftToDate, setDraftToDate] = useState(defaultToDate);
  const [topProductsLimit, setTopProductsLimit] = useState(
    defaultTopProductsLimit,
  );
  const [draftTopProductsLimit, setDraftTopProductsLimit] = useState(
    String(defaultTopProductsLimit),
  );
  const [dateFilterOpen, setDateFilterOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const qs = new URLSearchParams({
          filter: JSON.stringify({ fromDate, toDate, topProductsLimit }),
        });

        const res = await fetch(
          `/api/dashboard/shop/overview?${qs.toString()}`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            credentials: "same-origin",
            cache: "no-store",
          },
        );

        const data = (await res
          .json()
          .catch(() => null)) as ShopOverviewResponse | null;

        if (!res.ok || !data || Number(data.code) !== 200) {
          throw new Error(data?.message || "Load dashboard failed");
        }

        if (!mounted) return;
        setOverview(data.data ?? null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load dashboard failed";
        if (!mounted) return;
        setLoadError(msg);
        toast.error(msg);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [fromDate, toDate, topProductsLimit]);

  const totalRevenue = safeNumber(overview?.totalRevenue);
  const totalOrders = safeNumber(overview?.totalOrders);
  const usingPromotionRate = safeNumber(overview?.usingPromotionRate);

  const topProducts = useMemo(() => {
    const raw = Array.isArray(overview?.topProducts)
      ? overview?.topProducts
      : [];
    return raw.map(asTopProduct).filter((x): x is TopProduct => Boolean(x));
  }, [overview?.topProducts]);

  return (
    <div className="min-h-screen bg-amber-50/20">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Dashboard cửa hàng
            </h1>
            <p className="text-muted-foreground mt-1">
              Tổng quan hoạt động cửa hàng
            </p>
          </div>

          <div className="self-start sm:self-auto">
            <Popover open={dateFilterOpen} onOpenChange={setDateFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-amber-200 bg-white hover:bg-amber-50"
                  disabled={isLoading}
                  aria-label="Chọn khoảng ngày"
                >
                  <CalendarDays className="w-4 h-4 text-amber-700" />
                </Button>
              </PopoverTrigger>

              <PopoverContent align="end" className="w-80 p-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-stone-600">
                        Từ ngày
                      </label>
                      <input
                        type="date"
                        value={draftFromDate}
                        onChange={(e) => setDraftFromDate(e.target.value)}
                        className="h-10 w-full rounded-md border border-amber-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-200"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-stone-600">
                        Đến ngày
                      </label>
                      <input
                        type="date"
                        value={draftToDate}
                        onChange={(e) => setDraftToDate(e.target.value)}
                        className="h-10 w-full rounded-md border border-amber-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-200"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-stone-600">
                        Top products limit
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        step={1}
                        value={draftTopProductsLimit}
                        onChange={(e) =>
                          setDraftTopProductsLimit(e.target.value)
                        }
                        className="h-10 w-full rounded-md border border-amber-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-200"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-amber-200 bg-white hover:bg-amber-50"
                      onClick={() => {
                        setFromDate(defaultFromDate);
                        setToDate(defaultToDate);
                        setDraftFromDate(defaultFromDate);
                        setDraftToDate(defaultToDate);
                        setTopProductsLimit(defaultTopProductsLimit);
                        setDraftTopProductsLimit(
                          String(defaultTopProductsLimit),
                        );
                        setDateFilterOpen(false);
                      }}
                      disabled={isLoading}
                    >
                      Mặc định
                    </Button>
                    <Button
                      type="button"
                      className="bg-amber-700 hover:bg-amber-800"
                      onClick={() => {
                        if (
                          draftFromDate &&
                          draftToDate &&
                          draftFromDate > draftToDate
                        ) {
                          toast.error(
                            "Từ ngày phải nhỏ hơn hoặc bằng đến ngày",
                          );
                          return;
                        }

                        const limit = Number(draftTopProductsLimit);
                        if (
                          !Number.isFinite(limit) ||
                          limit <= 0 ||
                          !Number.isInteger(limit)
                        ) {
                          toast.error(
                            "Top products limit must be an integer > 0",
                          );
                          return;
                        }

                        setFromDate(draftFromDate);
                        setToDate(draftToDate);
                        setTopProductsLimit(limit);
                        setDateFilterOpen(false);
                      }}
                      disabled={isLoading}
                    >
                      Áp dụng
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {loadError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-amber-200/60 bg-amber-100/40 px-6 py-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-stone-600">Tổng doanh thu</p>
                <p className="text-4xl font-semibold text-stone-900">
                  {isLoading ? "—" : toVnd(totalRevenue)}
                </p>
                <p className="text-sm text-stone-500">
                  Tổng doanh thu trong kỳ
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-amber-200/70 text-amber-800 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200/60 bg-emerald-100/40 px-6 py-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-stone-600">Tổng đơn hàng</p>
                <p className="text-4xl font-semibold text-stone-900">
                  {isLoading ? "—" : totalOrders.toLocaleString("vi-VN")}
                </p>
                <p className="text-sm text-stone-500">Số đơn hàng đã xử lý</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-emerald-200/70 text-emerald-800 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200/60 bg-amber-100/40 px-6 py-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-stone-600">Tỷ lệ dùng khuyến mãi</p>
                <p className="text-4xl font-semibold text-stone-900">
                  {isLoading
                    ? "—"
                    : `${usingPromotionRate.toLocaleString("vi-VN")}%`}
                </p>
                <p className="text-sm text-stone-500">Đơn hàng có khuyến mãi</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-amber-200/70 text-amber-800 flex items-center justify-center">
                <Percent className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white px-6 py-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-stone-900">
              Sản phẩm bán chạy
            </h2>
            <p className="text-xs text-stone-500">
              {fromDate} → {toDate}
            </p>
          </div>

          <div className="mt-6">
            {isLoading ? (
              <div className="h-64 rounded-xl bg-stone-50 animate-pulse" />
            ) : topProducts.length === 0 ? (
              <div className="h-64 rounded-xl flex flex-col items-center justify-center text-center">
                <div className="h-14 w-14 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center">
                  <Coffee className="w-7 h-7" />
                </div>
                <p className="mt-4 text-base font-medium text-stone-700">
                  Chưa có dữ liệu
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  Dữ liệu sẽ hiển thị khi có đơn hàng
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {topProducts.slice(0, topProductsLimit).map((item, idx) => (
                  <div
                    key={item.name}
                    className="py-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-100">
                        <span className="text-sm font-semibold">{idx + 1}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-stone-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-stone-500">
                          {item.qty.toLocaleString("vi-VN")} sản phẩm
                        </p>
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-amber-800 whitespace-nowrap">
                      {toVnd(item.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
