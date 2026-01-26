"use client";

import { JSX, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search,
  Clock3,
  CheckCircle2,
  XCircle,
  Loader2,
  Bike,
  Coffee,
  User,
  MapPin,
  Phone,
} from "lucide-react";

interface Order {
  id: string;
  customer: string;
  phone: string;
  table?: string;
  address?: string;
  status: "PENDING" | "MAKING" | "DELIVERING" | "DONE" | "CANCELLED";
  items: { name: string; qty: number }[];
  createdAt: string;
  eta?: string;
  note?: string;
}

const MOCK_ORDERS: Order[] = [
  {
    id: "A-1024",
    customer: "Khách A",
    phone: "0909 123 456",
    table: "T3",
    status: "MAKING",
    items: [
      { name: "Cold Brew Cam Sành", qty: 1 },
      { name: "Latte Hạnh Nhân", qty: 2 },
    ],
    createdAt: "10:12",
    eta: "10:20",
    note: "Ít đá, gọi trước khi mang ra",
  },
  {
    id: "B-2031",
    customer: "Khách B",
    phone: "0912 888 222",
    address: "12 Nguyễn Huệ, Q1",
    status: "DELIVERING",
    items: [{ name: "Trà Ô Long Sữa Rang", qty: 1 }],
    createdAt: "09:58",
    eta: "10:25",
  },
  {
    id: "C-8891",
    customer: "Khách C",
    phone: "0987 222 111",
    table: "T8",
    status: "DONE",
    items: [
      { name: "Americano", qty: 1 },
      { name: "Bánh mousse matcha", qty: 1 },
    ],
    createdAt: "09:40",
    eta: "09:50",
  },
  {
    id: "D-5521",
    customer: "Khách D",
    phone: "0933 111 000",
    status: "PENDING",
    items: [{ name: "Cà phê sữa đá", qty: 2 }],
    createdAt: "10:15",
  },
  {
    id: "E-1122",
    customer: "Khách E",
    phone: "0969 555 666",
    status: "CANCELLED",
    items: [{ name: "Trà đào cam sả", qty: 1 }],
    createdAt: "09:20",
    note: "Hủy do đổi ý",
  },
];

const STATUS_META: Record<
  Order["status"],
  { label: string; color: string; icon: JSX.Element }
> = {
  PENDING: {
    label: "Chờ xác nhận",
    color: "bg-gray-100 text-gray-700 border border-gray-200",
    icon: <Clock3 className="w-3.5 h-3.5" />,
  },
  MAKING: {
    label: "Đang pha chế",
    color: "bg-amber-50 text-amber-800 border border-amber-200",
    icon: <Coffee className="w-3.5 h-3.5" />,
  },
  DELIVERING: {
    label: "Đang giao / mang ra",
    color: "bg-blue-50 text-blue-700 border border-blue-200",
    icon: <Bike className="w-3.5 h-3.5" />,
  },
  DONE: {
    label: "Hoàn thành",
    color: "bg-green-50 text-green-700 border border-green-200",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  CANCELLED: {
    label: "Hủy",
    color: "bg-red-50 text-red-700 border border-red-200",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

export default function OrderStatusPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<Order["status"] | "ALL">(
    "ALL",
  );

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return MOCK_ORDERS.filter((o) => {
      const matchKw =
        !kw ||
        o.customer.toLowerCase().includes(kw) ||
        o.id.toLowerCase().includes(kw) ||
        o.items.some((it) => it.name.toLowerCase().includes(kw));
      const matchStatus = filterStatus === "ALL" || o.status === filterStatus;
      return matchKw && matchStatus;
    });
  }, [search, filterStatus]);

  return (
    <div className="space-y-5 max-w-6xl mx-auto px-4 py-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-2 py-1.5 shadow-sm">
          <Search className="w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm đơn, khách, món"
            className="border-0 shadow-none focus-visible:ring-0 text-sm h-9 min-w-[220px]"
          />
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-1.5 py-1 shadow-sm">
          {[
            { key: "ALL", label: "Tất cả" },
            { key: "PENDING", label: "Chờ" },
            { key: "MAKING", label: "Đang pha" },
            { key: "DELIVERING", label: "Đang giao" },
            { key: "DONE", label: "Hoàn thành" },
          ].map((s) => (
            <Button
              key={s.key}
              size="sm"
              variant={filterStatus === s.key ? "default" : "ghost"}
              className={`rounded-full h-8 px-3 text-xs ${
                filterStatus === s.key ? "" : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => setFilterStatus(s.key as typeof filterStatus)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((order) => {
          const meta = STATUS_META[order.status];
          return (
            <Card
              key={order.id}
              className="border-gray-100 shadow-sm hover:shadow-md transition h-full flex flex-col"
            >
              <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base">{order.customer}</CardTitle>
                  <p className="text-xs text-gray-500">Mã đơn: {order.id}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.color}`}
                >
                  {meta.icon}
                  {meta.label}
                </span>
              </CardHeader>
              <CardContent className="space-y-3 text-sm flex-1 flex flex-col">
                <div className="flex items-center gap-2 text-gray-700">
                  <User className="w-4 h-4 text-amber-700" />
                  <span>{order.phone}</span>
                  {order.table && (
                    <span className="ml-auto rounded-full bg-amber-50 text-amber-800 text-[11px] px-2 py-1 border border-amber-100">
                      Bàn {order.table}
                    </span>
                  )}
                  {order.address && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-gray-600">
                      <MapPin className="w-3.5 h-3.5" /> {order.address}
                    </span>
                  )}
                </div>

                <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-2 space-y-1 min-h-[72px]">
                  {order.items.map((it) => (
                    <div
                      key={`${order.id}-${it.name}`}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-800">{it.name}</span>
                      <span className="font-semibold text-stone-900">
                        x{it.qty}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="w-4 h-4" />
                    Tạo lúc {order.createdAt}
                  </span>
                  {order.eta && <span>ETA: {order.eta}</span>}
                </div>

                {order.note && (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-2">
                    Note: {order.note}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-auto">
                  {order.status === "DONE" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-8 text-xs"
                    >
                      In hóa đơn
                    </Button>
                  ) : order.status === "CANCELLED" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-8 text-xs"
                    >
                      Xem lý do
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        variant="outline"
                      >
                        Gọi lại
                      </Button>
                      <Button size="sm" className="flex-1 h-8 text-xs">
                        Đánh dấu hoàn thành
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
