"use client";

import { useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  Clock,
  ShieldCheck,
  Phone,
  Mail,
  Briefcase,
  Filter,
  ArrowDownRight,
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

type Status = "active" | "off" | "probation";

type Employee = {
  id: number;
  name: string;
  role: string;
  shift: string;
  phone: string;
  email: string;
  status: Status;
  startDate: string;
};

const EMPLOYEES: Employee[] = [
  {
    id: 1,
    name: "Nguyễn An",
    role: "Barista",
    shift: "Sáng (08:00 - 14:00)",
    phone: "0901 223 345",
    email: "an@coffee.vn",
    status: "active",
    startDate: "12/2024",
  },
  {
    id: 2,
    name: "Trần Nhung",
    role: "Thu ngân",
    shift: "Sáng (08:00 - 14:00)",
    phone: "0933 445 667",
    email: "nhung@coffee.vn",
    status: "active",
    startDate: "05/2024",
  },
  {
    id: 3,
    name: "Lê Minh",
    role: "Ca trưởng",
    shift: "Chiều (14:00 - 22:00)",
    phone: "0977 889 001",
    email: "minh@coffee.vn",
    status: "probation",
    startDate: "01/2026",
  },
  {
    id: 4,
    name: "Phạm Hậu",
    role: "Barista",
    shift: "Chiều (14:00 - 22:00)",
    phone: "0909 222 111",
    email: "hau@coffee.vn",
    status: "off",
    startDate: "08/2023",
  },
  {
    id: 5,
    name: "Đỗ Vy",
    role: "Phụ bếp",
    shift: "Part-time (18:00 - 22:00)",
    phone: "0912 345 888",
    email: "vy@coffee.vn",
    status: "active",
    startDate: "11/2025",
  },
];

const statusLabel: Record<Status, string> = {
  active: "Đang làm",
  off: "Nghỉ / Off",
  probation: "Thử việc",
};

const statusStyle: Record<Status, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  off: "bg-gray-100 text-gray-700 border-gray-200",
  probation: "bg-amber-100 text-amber-800 border-amber-200",
};

const formatNumber = new Intl.NumberFormat("vi-VN");

export default function EmployeesPage() {
  const [keyword, setKeyword] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");

  const stats = useMemo(() => {
    const total = EMPLOYEES.length;
    const active = EMPLOYEES.filter((e) => e.status === "active").length;
    const probation = EMPLOYEES.filter((e) => e.status === "probation").length;
    const off = EMPLOYEES.filter((e) => e.status === "off").length;
    return { total, active, probation, off };
  }, []);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return EMPLOYEES.filter((e) => {
      const matchKw =
        !kw ||
        e.name.toLowerCase().includes(kw) ||
        e.role.toLowerCase().includes(kw) ||
        e.phone.replace(/\s+/g, "").includes(kw);
      const matchStatus = filterStatus === "all" || e.status === filterStatus;
      return matchKw && matchStatus;
    });
  }, [keyword, filterStatus]);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-gray-500">Nhân sự</p>
          <h1 className="text-2xl font-semibold text-stone-900">
            Quản lý nhân viên
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Lọc nâng cao
          </Button>
          <Button size="sm" className="gap-2">
            <UserPlus className="w-4 h-4" />
            Thêm nhân viên
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-amber-200 bg-amber-50/70">
          <CardHeader className="pb-1 pt-1 px-2.5">
            <CardTitle className="text-[11px] text-amber-900 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Tổng nhân sự
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2 px-2.5">
            <p className="text-xl font-bold text-stone-900 leading-tight">
              {formatNumber.format(stats.total)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/70">
          <CardHeader className="pb-1 pt-1 px-2.5">
            <CardTitle className="text-[11px] text-green-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Đang làm
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2 px-2.5">
            <p className="text-xl font-bold text-stone-900 leading-tight">
              {formatNumber.format(stats.active)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/70">
          <CardHeader className="pb-1 pt-1 px-2.5">
            <CardTitle className="text-[11px] text-amber-900 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Thử việc
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2 px-2.5">
            <p className="text-xl font-bold text-stone-900 leading-tight">
              {formatNumber.format(stats.probation)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50">
          <CardHeader className="pb-1 pt-1 px-2.5">
            <CardTitle className="text-[11px] text-gray-800 flex items-center gap-1.5">
              <ArrowDownRight className="w-3.5 h-3.5" /> Off / Nghỉ
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2 px-2.5">
            <p className="text-xl font-bold text-stone-900 leading-tight">
              {formatNumber.format(stats.off)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-2 py-1 shadow-sm">
          {["all", "active", "probation", "off"].map((st) => {
            const label =
              st === "all"
                ? "Tất cả"
                : st === "active"
                  ? "Đang làm"
                  : st === "probation"
                    ? "Thử việc"
                    : "Off";
            return (
              <Button
                key={st}
                size="sm"
                variant={filterStatus === st ? "default" : "ghost"}
                className={`rounded-full h-8 px-3 text-[11px] ${
                  filterStatus === st ? "" : "text-gray-600 hover:bg-gray-100"
                }`}
                onClick={() => setFilterStatus(st as Status | "all")}
              >
                {label}
              </Button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-2 py-1.5 shadow-sm min-w-[220px]">
          <Mail className="w-4 h-4 text-gray-400" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm tên / vai trò / SĐT"
            className="border-0 shadow-none focus-visible:ring-0 text-xs h-8 px-2"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="px-4 py-3 border-b">
          <CardTitle className="text-sm">Danh sách nhân viên</CardTitle>
          <CardDescription className="text-xs">
            Thông tin ca, liên hệ, trạng thái
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm leading-tight">
              <thead className="bg-gray-50 text-gray-600 border-b">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold w-[28%]">
                    Tên
                  </th>
                  <th className="text-left px-3 py-2 font-semibold w-[18%]">
                    Vai trò
                  </th>
                  <th className="text-left px-3 py-2 font-semibold w-[22%]">
                    Ca làm
                  </th>
                  <th className="text-left px-3 py-2 font-semibold w-[18%]">
                    Liên hệ
                  </th>
                  <th className="text-left px-3 py-2 font-semibold w-[14%]">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="px-3 py-3">
                      <div className="font-semibold text-stone-900">
                        {e.name}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Bắt đầu: {e.startDate}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-700 text-sm">
                      {e.role}
                    </td>
                    <td className="px-3 py-3 text-gray-700 text-sm">
                      {e.shift}
                    </td>
                    <td className="px-3 py-3 text-gray-700 text-sm space-y-1">
                      <div className="flex items-center gap-1 text-xs">
                        <Phone className="w-3.5 h-3.5 text-gray-500" />{" "}
                        {e.phone}
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Mail className="w-3.5 h-3.5 text-gray-500" /> {e.email}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${statusStyle[e.status]}`}
                      >
                        {statusLabel[e.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
