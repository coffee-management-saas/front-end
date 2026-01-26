import React from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Coffee,
  Clock,
  Receipt,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("vi-VN");

type Stat = {
  label: string;
  value: number;
  change: number; // percent
  icon: React.ElementType;
  accent: string;
  formatter?: (n: number) => string;
};

const statCards: Stat[] = [
  {
    label: "Tổng doanh thu hôm nay",
    value: 12_500_000,
    change: 13.6,
    icon: Wallet,
    accent: "from-amber-50 to-orange-100/80 border-amber-200 text-amber-900",
    formatter: (n) => currency.format(n),
  },
  {
    label: "Số đơn đã bán",
    value: 182,
    change: 8.2,
    icon: ShoppingBag,
    accent: "from-green-50 to-emerald-100/80 border-emerald-200 text-emerald-900",
    formatter: (n) => number.format(n) + " đơn",
  },
  {
    label: "Giá trị đơn TB",
    value: 68_700,
    change: -2.1,
    icon: Receipt,
    accent: "from-blue-50 to-sky-100/80 border-sky-200 text-sky-900",
    formatter: (n) => currency.format(n),
  },
];

const topItems = [
  { name: "Cold Brew Cam Sành", qty: 42, revenue: 2_436_000 },
  { name: "Latte Hạnh Nhân", qty: 38, revenue: 2_461_000 },
  { name: "Trà Ô Long Sữa Rang", qty: 31, revenue: 1_612_000 },
  { name: "Mousse Matcha", qty: 24, revenue: 1_080_000 },
];

const quickActions = [
  { label: "Tạo đơn mới", icon: ShoppingBag },
  { label: "Thêm món / combo", icon: Coffee },
  { label: "Xuất báo cáo PDF", icon: Receipt },
  { label: "Xem ca hiện tại", icon: Clock },
];

export default function Page() {
  const yesterdayRevenue = 11_000_000;
  const todayRevenue = statCards[0].value;
  const changePercent =
    yesterdayRevenue > 0
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
      : 0;
  const isUp = changePercent >= 0;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Tổng quan cửa hàng</p>
          <h1 className="text-2xl font-semibold text-stone-900">
            Dashboard vận hành
          </h1>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const positive = stat.change >= 0;
          return (
            <Card
              key={stat.label}
              className={`bg-gradient-to-br ${stat.accent} shadow-sm`}
            >
              <CardHeader className="pb-1">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <CardTitle className="text-sm">{stat.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex items-end justify-between pb-4">
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-stone-900 leading-tight">
                    {stat.formatter ? stat.formatter(stat.value) : stat.value}
                  </div>
                  {stat.label === "Tổng doanh thu hôm nay" && (
                    <p className="text-xs text-gray-700">
                      Hôm qua: {currency.format(yesterdayRevenue)}
                    </p>
                  )}
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                    positive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {positive ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {Math.abs(stat.change).toFixed(1)}%
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top món bán chạy hôm nay</CardTitle>
            <CardDescription className="text-sm">
              Thống kê realtime theo số lượng bán ra
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {topItems.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between py-3 first:pt-0"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">{item.name}</p>
                    <p className="text-xs text-gray-600">
                      Doanh thu: {currency.format(item.revenue)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-stone-900">
                    {number.format(item.qty)} ly
                  </p>
                  <p className="text-xs text-gray-500">Hôm nay</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tác vụ nhanh</CardTitle>
            <CardDescription className="text-sm">
              Dành cho ca hiện tại
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((act) => {
                const Icon = act.icon;
                return (
                  <button
                    key={act.label}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-left text-sm font-semibold text-stone-900 shadow-sm hover:border-amber-200 hover:bg-amber-50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-amber-700" />
                      {act.label}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 flex items-start gap-3">
              <div className="mt-0.5">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-stone-900">
                  Cảnh báo tồn kho
                </p>
                <p className="text-xs text-amber-900">
                  Syrup vanilla còn 12%, hạt điều còn 18%. Đề xuất nhập bổ sung.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-green-100 bg-green-50 px-3 py-3 flex items-start gap-3">
              <div className="mt-0.5">
                <Users className="w-4 h-4 text-green-700" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-stone-900">
                  Ca hiện tại
                </p>
                <p className="text-xs text-gray-700">
                  Barista: Nhung, An • Thu ngân: Minh • Thời gian: 08:00 - 14:00
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
