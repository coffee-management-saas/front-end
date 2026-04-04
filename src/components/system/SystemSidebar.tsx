"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, FolderTree, LogOut, Tag } from "lucide-react";

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
  { title: "Dashboard", href: "/system", icon: LayoutDashboard },
  { title: "Cửa hàng", href: "/system/shop-manager", icon: FolderTree },
  { title: "Gói ưu đãi", href: "/system/subscription-manager", icon: Tag },
];

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export function SystemSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setTokens } = useAppContext();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/admin") return pathname === "/admin";
    if (href === "/system") return pathname === "/system";
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
        router.replace("/system/login");
      } catch (err) {
        console.error("Redirect error:", err);
      }
    }
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center overflow-hidden">
            <Image
              src="/images/logo1.png"
              alt="Coffee"
              fill
              className="object-contain p-1"
              sizes="40px"
              priority
            />
          </div>

          <div>
            <h1
              className="font-semibold text-sidebar-foreground text-lg"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              F&B Admin
            </h1>
            <p className="text-xs text-sidebar-foreground/60">
              Quản lý nội dung
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
          onClick={() => void handleLogout()}
        >
          <LogOut className="w-5 h-5" />
          <span>Đăng xuất</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
