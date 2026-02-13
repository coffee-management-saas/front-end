"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon, ShoppingBag } from "lucide-react";
import {
  Coffee,
  LayoutDashboard,
  FolderTree,
  Package,
  Users,
  Settings,
  LogOut,
  ShoppingBagIcon,
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

type MenuItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

const menuItems: MenuItem[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Danh mục", href: "/admin/categories-manager", icon: FolderTree },
  { title: "Khuyến mãi", href: "/admin/promotions-manager", icon: Package },
  { title: "Sản phẩm", href: "/admin/products-manager", icon: Coffee },
  { title: "Toppings", href: "/admin/toppings-manager", icon: ShoppingBagIcon },
  { title: "Sizes", href: "/admin/sizes-manager", icon: ShoppingBagIcon },
  {
    title: "Biến thể sản phẩm",
    href: "/admin/variants-manager",
    icon: ShoppingBagIcon,
  },
  { title: "Nhân viên", href: "/admin/employees-manager", icon: Users },
  { title: "Cài đặt", href: "/settings", icon: Settings },
];

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <Coffee className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>

          <div>
            <h1
              className="font-semibold text-sidebar-foreground text-lg"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Coffee Admin
            </h1>
            <p className="text-xs text-sidebar-foreground/60">
              Quản lý quán café
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4 bg-[#F9F7F5]">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-sidebar-foreground/50 text-xs uppercase tracking-wider mb-2">
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
                          "flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors",
                          "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                          active &&
                            "bg-sidebar-accent text-sidebar-primary font-medium",
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <button
          type="button"
          className="flex items-center gap-3 w-full py-2.5 px-3 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          onClick={() => {}}
        >
          <LogOut className="w-5 h-5" />
          <span>Đăng xuất</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
