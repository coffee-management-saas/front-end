"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Menu,
  ShoppingBag,
  Clock,
  Users,
  Settings,
  Heart,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
}

export default function Sidebar({ isOpen = true }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { icon: Home, label: "Quản lý", href: "/staff" },
    { icon: Menu, label: "Menu", href: "/staff/menu" },
    {
      icon: ShoppingBag,
      label: "Trạng thái đơn",
      href: "/staff/order",
      badge: 0,
    },
    { icon: Clock, label: "Công thức", href: "/staff/recipe" },
  ];

  const bottomItems = [
    { icon: Users, label: "Nhân viên", href: "/staff/employees" },
    { icon: Settings, label: "Cài đặt", href: "/settings" },
    { icon: Heart, label: "Khuyến mãi", href: "/staff/promotion" },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-amber-700">F&B</span>
          <span className="text-2xl font-bold text-gray-800">Coffee</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="px-4 flex flex-col justify-between h-[calc(100vh-100px)]">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "text-amber-700 bg-amber-50"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto bg-amber-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom Navigation */}
        <div className="space-y-1 pb-6">
          <div className="border-t border-gray-200 pt-4 mb-4"></div>
          {bottomItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "text-amber-700 bg-amber-50"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}

          <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors w-full">
            <LogOut size={20} />
            <span className="text-sm font-medium">Đăng xuất</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
