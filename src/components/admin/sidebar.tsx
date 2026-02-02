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
  { label: "Danh mục", href: "/admin/categories-manager", icon: Tags },
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
      } bg-[#876F60] text-amber-50 border-r border-black/10 shadow-[4px_0_16px_rgba(0,0,0,0.18)]`}
    >
      <div className="px-4 py-4 flex items-center gap-3 border-b border-black/10 bg-white/10 backdrop-blur sticky top-0 z-10">
        <div className="h-10 w-10 rounded-2xl bg-[#693916] text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-black/20">
          AD
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Admin Panel</p>
          <p className="text-xs text-white/80">F&B Coffee</p>
        </div>
      </div>

      <nav className="px-3 py-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-black/20">
        <p className="px-3 text-[11px] uppercase tracking-[0.18em] text-white/75 mb-1">
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
                  ? "bg-white/20 text-white border-white/25 shadow-md shadow-black/15"
                  : "border-transparent text-white/90 hover:border-white/20 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                  active
                    ? "bg-white/25 text-white"
                    : "bg-white/15 text-white/90"
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
        <button className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/20 shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
