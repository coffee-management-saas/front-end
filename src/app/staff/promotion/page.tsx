"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  PauseCircle,
  Percent,
  Plus,
  Search,
  Tag,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

 type Status = "active" | "scheduled" | "expired";

type Promotion = {
  id: number;
  name: string;
  code: string;
  type: "percent" | "amount";
  value: number;
  condition: string;
  channel: "POS" | "App" | "Tất cả";
  start: string;
  end: string;
  status: Status;
  usage: number;
  limit: number;
};

const PROMOS: Promotion[] = [
  {
    id: 1,
    name: "Combo sáng -10%",
    code: "MORNING10",
    type: "percent",
    value: 10,
    condition: "Áp dụng 07:00-11:00, đơn từ 80K",
    channel: "POS",
    start: "20/01/2026",
    end: "31/01/2026",
    status: "active",
    usage: 124,
    limit: 500,
  },
  {
    id: 2,
    name: "Giảm 20K cho đơn 120K",
    code: "SAVE20",
    type: "amount",
    value: 20000,
    condition: "Đơn từ 120K, áp dụng App",
    channel: "App",
    start: "25/01/2026",
    end: "10/02/2026",
    status: "scheduled",
    usage: 0,
    limit: 800,
  },
  {
    id: 3,
    name: "Mua 2 latte tặng 1",
    code: "LATTE3",
    type: "percent",
    value: 100,
    condition: "Tặng ly thứ 3 rẻ nhất",
    channel: "Tất cả",
    start: "05/01/2026",
    end: "18/01/2026",
    status: "expired",
    usage: 362,
    limit: 400,
  },
];

const statusLabel: Record<Status, string> = {
  active: "Đang chạy",
  scheduled: "Lên lịch",
  expired: "Hết hạn",
};

const statusStyle: Record<Status, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  expired: "bg-gray-100 text-gray-600 border-gray-200",
};

const percent = (usage: number, limit: number) =>
  limit > 0 ? Math.min(100, Math.round((usage / limit) * 100)) : 0;

export default function PromotionPage() {
  const [keyword, setKeyword] = useState("");
  const [tab, setTab] = useState<Status | "all">("all");

  const stats = useMemo(() => {
    return {
      total: PROMOS.length,
      active: PROMOS.filter((p) => p.status === "active").length,
      scheduled: PROMOS.filter((p) => p.status === "scheduled").length,
      expired: PROMOS.filter((p) => p.status === "expired").length,
    };
  }, []);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return PROMOS.filter((p) => {
      const matchKw =
        !kw ||
        p.name.toLowerCase().includes(kw) ||
        p.code.toLowerCase().includes(kw) ||
        p.condition.toLowerCase().includes(kw);
      const matchTab = tab === "all" || p.status === tab;
      return matchKw && matchTab;
    });
  }, [keyword, tab]);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-gray-500">Khuyến mãi</p>
          <h1 className="text-2xl font-semibold text-stone-900">
            Chương trình ưu đãi
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" size="sm">
            <Tag className="w-4 h-4" /> Mẫu có sẵn
          </Button>
          <Button className="gap-2" size="sm">
            <Plus className="w-4 h-4" /> Tạo khuyến mãi
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-amber-200 bg-amber-50/70">
          <CardHeader className="pb-1 pt-1 px-2">
            <CardTitle className="text-[10px] text-amber-900 flex items-center gap-1">
              <Percent className="w-3 h-3" /> Tổng số CTKM
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2 px-2">
            <p className="text-lg font-bold text-stone-900 leading-tight">
              {stats.total}
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/70">
          <CardHeader className="pb-1 pt-1 px-2">
            <CardTitle className="text-[10px] text-green-900 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Đang chạy
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2 px-2">
            <p className="text-lg font-bold text-stone-900 leading-tight">
              {stats.active}
            </p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/70">
          <CardHeader className="pb-1 pt-1 px-2">
            <CardTitle className="text-[10px] text-blue-900 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Lên lịch
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2 px-2">
            <p className="text-lg font-bold text-stone-900 leading-tight">
              {stats.scheduled}
            </p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-gray-50">
          <CardHeader className="pb-1 pt-1 px-2">
            <CardTitle className="text-[10px] text-gray-800 flex items-center gap-1">
              <PauseCircle className="w-3 h-3" /> Hết hạn
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2 px-2">
            <p className="text-lg font-bold text-stone-900 leading-tight">
              {stats.expired}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-2 py-1 shadow-sm">
          {["all", "active", "scheduled", "expired"].map((st) => {
            const label =
              st === "all"
                ? "Tất cả"
                : st === "active"
                  ? "Đang chạy"
                  : st === "scheduled"
                    ? "Lên lịch"
                    : "Hết hạn";
            return (
              <Button
                key={st}
                size="sm"
                variant={tab === st ? "default" : "ghost"}
                className={`rounded-full h-8 px-3 text-[11px] ${
                  tab === st ? "" : "text-gray-600 hover:bg-gray-100"
                }`}
                onClick={() => setTab(st as Status | "all")}
              >
                {label}
              </Button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-2 py-1.5 shadow-sm min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm tên / mã / điều kiện"
            className="border-0 shadow-none focus-visible:ring-0 text-xs h-8 px-2"
          />
        </div>
      </div>

      {/* List */}
      <Card>
        <CardHeader className="px-3 py-2.5 border-b">
          <CardTitle className="text-sm">Danh sách chương trình</CardTitle>
          <CardDescription className="text-xs">
            Kiểm soát trạng thái, thời gian, giới hạn lượt dùng
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.map((p) => {
              const progress = percent(p.usage, p.limit);
              return (
                <div key={p.id} className="px-3 py-2.5 grid grid-cols-12 gap-2.5 items-start">
                  <div className="col-span-12 sm:col-span-4 space-y-0.5">
                    <p className="font-semibold text-stone-900 text-sm">{p.name}</p>
                    <p className="text-[11px] text-gray-600">Mã: {p.code}</p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${statusStyle[p.status]}`}
                    >
                      {statusLabel[p.status]}
                    </span>
                  </div>

                  <div className="col-span-6 sm:col-span-3 text-[13px] text-gray-700 space-y-0.5">
                    <p className="font-semibold text-stone-900 flex items-center gap-1">
                      {p.type === "percent" ? `${p.value}%` : `${p.value.toLocaleString("vi-VN")}đ`} <ArrowUpRight className="w-3.5 h-3.5 text-amber-700" />
                    </p>
                    <p className="text-[11px] text-gray-600">{p.condition}</p>
                    <p className="text-[11px] text-gray-600">Kênh: {p.channel}</p>
                  </div>

                  <div className="col-span-6 sm:col-span-3 text-[11px] text-gray-700 space-y-0.5">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" /> {p.start} - {p.end}
                    </div>
                    <div className="text-[11px] text-gray-600">Lượt dùng: {p.usage}/{p.limit}</div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`${
                          p.status === "expired"
                            ? "bg-gray-300"
                            : p.status === "scheduled"
                              ? "bg-blue-400"
                              : "bg-green-500"
                        } h-full transition-all`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="col-span-12 sm:col-span-2 flex flex-wrap gap-2 justify-end text-xs">
                    <Button variant="outline" size="sm" className="h-8 px-3">Chỉnh sửa</Button>
                    <Button variant="ghost" size="sm" className="h-8 px-3 text-red-600 hover:text-red-700">
                      Ngưng
                    </Button>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-gray-600 flex flex-col items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Không tìm thấy chương trình phù hợp.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
