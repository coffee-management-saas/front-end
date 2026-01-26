"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Tags,
  Users,
  BarChart3,
  Settings,
  TicketPercent,
  LogOut,
} from "lucide-react";

const nav = [
  { label: "Quản lý", href: "/admin", icon: LayoutDashboard },
  { label: "Công thức", href: "/admin/ingredients-manager", icon: ShoppingBag },
  { label: "Sản phẩm", href: "/admin/menu-manager", icon: Tags },
  {
    label: "Khuyến mãi",
    href: "/admin/promotions-manager",
    icon: TicketPercent,
  },
  { label: "Nhân viên", href: "/admin/employees-manager", icon: Users },
  { label: "Khách hàng", href: "/admin/customers-manager", icon: BarChart3 },
  { label: "Kho hàng", href: "/admin/inventorys-manager", icon: BarChart3 },
  { label: "Cài đặt", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar({ isOpen = true }: { isOpen?: boolean }) {
  const pathname = usePathname();

  return (
    <aside
      className={`h-screen flex flex-col transition-all duration-200 ${
        isOpen ? "w-64" : "w-56"
      } bg-gradient-to-b from-[#2b1d13] via-[#321f14] to-[#1f140d] text-amber-50 border-r border-amber-900/25 shadow-[4px_0_16px_rgba(0,0,0,0.18)]`}
    >
      <div className="px-4 py-4 flex items-center gap-3 border-b border-amber-900/25 bg-white/5 backdrop-blur sticky top-0 z-10">
        <div className="h-10 w-10 rounded-2xl bg-amber-700 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-amber-900/30">
          AD
        </div>
        <div>
          <p className="text-sm font-semibold">Admin Panel</p>
          <p className="text-xs text-amber-100/85">F&B Coffee</p>
        </div>
      </div>

      <nav className="px-3 py-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-amber-800/40">
        <p className="px-3 text-[11px] uppercase tracking-[0.18em] text-amber-200/85 mb-1">
          Quản trị
        </p>
        {nav.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin" || pathname === "/admin/"
              : pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition-all border ${
                active
                  ? "bg-amber-600/15 text-amber-50 border-amber-500/40 shadow-md shadow-amber-900/25"
                  : "border-transparent text-amber-100/80 hover:border-amber-500/25 hover:bg-amber-500/10 hover:text-amber-50"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                  active
                    ? "bg-amber-500/30 text-amber-50"
                    : "bg-amber-500/15 text-amber-100"
                }`}
              >
                <Icon className="w-4 h-4" />
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-3 pb-4">
        <button className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/15 transition-all border border-transparent hover:border-red-500/30 shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
