"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Home,
  Menu,
  ShoppingBag,
  Users,
  LogOut,
  BookOpen,
  Gift,
} from "lucide-react";
import { useState } from "react";
import { logoutFromNextClientToNextServer } from "@/services/auth.service";
import { useAppContext } from "@/app/AppProvider";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";

interface SidebarProps {
  isOpen?: boolean;
}

export default function Sidebar({ isOpen = true }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { setTokens } = useAppContext();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const menuItems = [
    { icon: Home, label: "Quản lý", href: "/staff" },
    { icon: Menu, label: "Menu", href: "/staff/menu" },
    {
      icon: ShoppingBag,
      label: "Trạng thái đơn hàng",
      href: "/staff/order",
      badge: 0,
    },
    { icon: BookOpen, label: "Công thức", href: "/staff/recipe" },
  ];

  const bottomItems = [
    { icon: Users, label: "Nhân viên", href: "/staff/employees" },
    { icon: Gift, label: "Khuyến mãi", href: "/staff/promotion" },
  ];

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logoutFromNextClientToNextServer();
      toast.success("Đăng xuất thành công");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Đăng xuất thất bại");
    } finally {
      setTokens({ accessToken: "", refreshToken: "", expiresAt: "" });
      router.replace("/login");
      setLoggingOut(false);
    }
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-[#693916]">F&B Coffee</span>
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
                    ? "text-[#693916] bg-[#cec3bc]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-[#876F60]"
                }`}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto bg-[#cec3bc] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
                    ? "text-[#693916] bg-[#cec3bc]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-[#876F60]"
                }`}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setLogoutConfirmOpen(true)}
            disabled={loggingOut}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-[#876F60] transition-colors w-full disabled:opacity-60 disabled:pointer-events-none"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Đăng xuất</span>
          </button>
        </div>
      </nav>

      <DeleteConfirmDialog
        open={logoutConfirmOpen}
        onOpenChange={(open) => {
          if (!open && loggingOut) return;
          setLogoutConfirmOpen(open);
        }}
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          void handleLogout();
        }}
        title="Xác nhận đăng xuất"
        description="Bạn có chắc chắn muốn đăng xuất không?"
        confirmLabel="Đăng xuất"
        confirmClassName="bg-[#cec3bc] text-[#693916] hover:bg-[#b8aba3]"
      />
    </aside>
  );
}
