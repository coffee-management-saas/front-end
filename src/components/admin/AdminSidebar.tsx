"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Coffee,
  LayoutDashboard,
  FolderTree,
  Package,
  Users,
  LogOut,
  Ruler,
  Layers,
  Tag,
  ShoppingBag,
  Leaf,
  ReceiptText,
  NotebookPen,
  Calendar,
  ClipboardList,
  Award,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { toast } from "sonner";
import { logoutFromNextClientToNextServer } from "@/services/auth.service";
import { useAppContext } from "@/app/AppProvider";

type MenuItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

const menuItems: MenuItem[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },

  // Danh mục
  { title: "Danh mục", href: "/admin/categories-manager", icon: FolderTree },

  // Hạng thành viên (nên dùng Award)
  { title: "Hạng thành viên", href: "/admin/rank-manager", icon: Award },

  // Khuyến mãi
  { title: "Khuyến mãi", href: "/admin/promotions-manager", icon: Tag },

  // Sản phẩm
  { title: "Sản phẩm", href: "/admin/products-manager", icon: ShoppingBag },

  // Nguyên liệu
  { title: "Nguyên liệu", href: "/admin/ingredients-manager", icon: Leaf },

  // Hóa đơn nhập kho
  {
    title: "Hóa đơn nhập kho",
    href: "/admin/invoices-manager",
    icon: ReceiptText,
  },

  // Toppings
  { title: "Toppings", href: "/admin/toppings-manager", icon: Package },

  // Công thức
  { title: "Công thức", href: "/admin/recipes-manager", icon: NotebookPen },

  // Sizes
  { title: "Sizes", href: "/admin/sizes-manager", icon: Ruler },

  // Lịch làm việc
  { title: "Lịch làm việc", href: "/admin/schedules-manager", icon: Calendar },

  // Biến thể sản phẩm
  { title: "Biến thể sản phẩm", href: "/admin/variants-manager", icon: Layers },

  // Nhân viên
  { title: "Nhân viên", href: "/admin/employees-manager", icon: Users },

  // Kiểm tra tồn kho (đổi icon cho đúng ngữ nghĩa)
  {
    title: "Kiểm tra tồn kho",
    href: "/admin/stock-manager",
    icon: ClipboardList,
  },
];

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setTokens } = useAppContext();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    try {
      await logoutFromNextClientToNextServer();
      toast.success("Đăng xuất thành công");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Đăng xuất thất bại");
    } finally {
      try {
        setTokens({ accessToken: "", refreshToken: "", expiresAt: "" });
      } catch (err) {
        console.error("Clear tokens error:", err);
      }

      try {
        router.replace("/login");
      } catch (err) {
        console.error("Redirect error:", err);
      }
    }
  };

  return (
    <Sidebar className="border-r border-gray-200 bg-white">
      <SidebarHeader className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#cec3bc] flex items-center justify-center">
            <Coffee className="w-5 h-5 text-[#24201e]" />
          </div>

          <div>
            <h1
              className="font-semibold text-[#251911] text-lg"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Coffee Admin
            </h1>
            <p className="text-xs text-gray-500">Quản lý quán café</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4 bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-gray-400 text-xs uppercase tracking-wider mb-2">
            Menu chính
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const active = isActive(item.href);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="px-4">
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                          active
                            ? "text-[#010101] bg-[#cccccc]"
                            : "text-gray-600 hover:bg-gray-50 hover:text-[#9b9a99]",
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="text-sm font-medium">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-200 bg-white">
        <button
          type="button"
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-[#a29d9b] transition-colors"
          onClick={() => void handleLogout()}
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Đăng xuất</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
