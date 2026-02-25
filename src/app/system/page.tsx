"use client";

import React from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Coffee,
  ShoppingBag,
  Users,
  TicketPercent,
} from "lucide-react";

type StatCard = {
  label: string;
  value: string;
  change: number;
  icon: React.ElementType;
};

const statCards: StatCard[] = [
  {
    label: "Doanh thu hôm nay",
    value: "12,5M ₫",
    change: 12.6,
    icon: ArrowUpRight,
  },
  {
    label: "Doanh thu tuần",
    value: "68,4M ₫",
    change: 8.3,
    icon: ArrowUpRight,
  },
  {
    label: "Doanh thu tháng",
    value: "252,1M ₫",
    change: 5.1,
    icon: ArrowUpRight,
  },
  {
    label: "Tỉ lệ dùng voucher",
    value: "18%",
    change: -1.4,
    icon: TicketPercent,
  },
];

const opsCards = [
  { label: "Đơn hoàn thành", value: "382", change: 5.3, icon: ShoppingBag },
  { label: "Số khách", value: "610", change: 4.2, icon: Users },
  { label: "AOV", value: "66K ₫", change: 1.8, icon: ArrowUpRight },
];

const revenueWeek = [
  { day: "T2", amount: 8.2 },
  { day: "T3", amount: 9.4 },
  { day: "T4", amount: 7.5 },
  { day: "T5", amount: 10.1 },
  { day: "T6", amount: 12.5 },
  { day: "T7", amount: 14.2 },
  { day: "CN", amount: 11.8 },
];

const hourly = [
  { label: "7-9h", amount: 1.9 },
  { label: "9-11h", amount: 3.2 },
  { label: "11-13h", amount: 4.6 },
  { label: "13-15h", amount: 3.8 },
  { label: "15-17h", amount: 4.1 },
  { label: "17-19h", amount: 5.0 },
  { label: "19-21h", amount: 3.6 },
];

const topItems = [
  { name: "Cold Brew Cam Sành", qty: 42, revenue: 2.44 },
  { name: "Latte Hạnh Nhân", qty: 38, revenue: 2.46 },
  { name: "Trà Ô Long Sữa Rang", qty: 31, revenue: 1.61 },
  { name: "Mousse Matcha", qty: 24, revenue: 1.08 },
];

const categoryShare = [
  { label: "Coffee", value: 42, color: "bg-amber-700" },
  { label: "Tea / Milk Tea", value: 35, color: "bg-emerald-500" },
  { label: "Bakery", value: 13, color: "bg-amber-400" },
  { label: "Khác", value: 10, color: "bg-slate-400" },
];

const alerts = [
  {
    title: "Món bị tắt",
    desc: "Phin sữa đặc hết nguyên liệu • CN Quận 3",
    tone: "amber",
  },
  {
    title: "Nguyên liệu sắp hết",
    desc: "Syrup caramel còn 8% • Kiosk Q1",
    tone: "amber",
  },
  {
    title: "Đơn huỷ tăng",
    desc: "Tăng 18% trong 1h qua • App delivery",
    tone: "red",
  },
  {
    title: "Đánh giá xấu",
    desc: "3 review 2★ trong 1h • cần check quy trình",
    tone: "red",
  },
];

export default function SystemDashboardPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
      <div>
        <p className="text-sm text-gray-500">Tổng quan</p>
        <h1 className="text-2xl font-semibold text-stone-900">
          Dashboard cửa hàng
        </h1>
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const positive = card.change >= 0;
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-amber-100 bg-white shadow-sm px-4 py-4 flex items-center justify-between"
            >
              <div className="space-y-1">
                <p className="text-sm text-gray-600">{card.label}</p>
                <p className="text-2xl font-bold text-stone-900">
                  {card.value}
                </p>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    positive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {positive ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {Math.abs(card.change)}%
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Ops cards */}
      <div className="grid gap-3 md:grid-cols-3">
        {opsCards.map((card) => {
          const positive = card.change >= 0;
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-amber-100 bg-white shadow-sm px-4 py-4 flex items-center justify-between"
            >
              <div className="space-y-1">
                <p className="text-sm text-gray-600">{card.label}</p>
                <p className="text-2xl font-bold text-stone-900">
                  {card.value}
                </p>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    positive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {positive ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {Math.abs(card.change)}%
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue bar chart */}
        <div className="rounded-2xl border border-amber-100 bg-white shadow-sm p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500">Doanh thu tuần</p>
              <p className="text-base font-semibold text-stone-900">
                Thứ 2 - Chủ nhật
              </p>
            </div>
            <span className="text-xs text-gray-500">Đơn vị: triệu ₫</span>
          </div>
          <div className="flex items-end gap-3 h-48">
            {revenueWeek.map((d) => {
              const height = (d.amount / 15) * 100; // scale to 15m max
              return (
                <div
                  key={d.day}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-amber-600 to-amber-400 shadow-[0_6px_16px_rgba(0,0,0,0.08)]"
                    style={{ height: `${height}%` }}
                  />
                  <p className="text-xs text-gray-600">{d.day}</p>
                  <p className="text-[11px] text-gray-500">
                    {d.amount.toFixed(1)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category share */}
        <div className="rounded-2xl border border-amber-100 bg-white shadow-sm p-4 space-y-3">
          <div>
            <p className="text-sm text-gray-500">Cơ cấu doanh thu</p>
            <p className="text-base font-semibold text-stone-900">
              Theo nhóm sản phẩm
            </p>
          </div>
          <div className="space-y-2">
            {categoryShare.map((c) => (
              <div key={c.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm text-stone-900">
                  <span className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${c.color}`} />
                    {c.label}
                  </span>
                  <span className="text-gray-600">{c.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-amber-50">
                  <div
                    className={`${c.color} h-full rounded-full`}
                    style={{ width: `${c.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Doanh thu theo khung giờ */}
        <div className="rounded-2xl border border-amber-100 bg-white shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500">Doanh thu theo khung giờ</p>
              <p className="text-base font-semibold text-stone-900">Hôm nay</p>
            </div>
            <span className="text-xs text-gray-500">triệu ₫</span>
          </div>
          <div className="space-y-2">
            {hourly.map((h) => {
              const width = (h.amount / 5) * 100; // scale to 5m
              return (
                <div key={h.label}>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{h.label}</span>
                    <span>{h.amount.toFixed(1)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-amber-50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top món bán chạy */}
        <div className="rounded-2xl border border-amber-100 bg-white shadow-sm p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500">Top món bán chạy</p>
              <p className="text-base font-semibold text-stone-900">Hôm nay</p>
            </div>
            <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
              4 món
            </span>
          </div>
          <div className="divide-y">
            {topItems.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="font-semibold text-stone-900">{item.name}</p>
                  <p className="text-xs text-gray-600">{item.qty} ly</p>
                </div>
                <p className="text-sm font-semibold text-amber-800">
                  {item.revenue.toFixed(2)} M₫
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts / issues */}
      <div className="rounded-2xl border border-amber-100 bg-white shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Cảnh báo vận hành</p>
            <p className="text-base font-semibold text-stone-900">
              Cần xử lý sớm
            </p>
          </div>
          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
            {alerts.length} mục
          </span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {alerts.map((a) => (
            <div
              key={a.title}
              className={`rounded-xl border bg-white/60 px-3 py-3 shadow-sm ${
                a.tone === "amber"
                  ? "border-amber-200"
                  : a.tone === "red"
                    ? "border-red-200"
                    : "border-blue-200"
              }`}
            >
              <p className="text-sm font-semibold text-stone-900">{a.title}</p>
              <p className="text-xs text-gray-600 mt-1">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
