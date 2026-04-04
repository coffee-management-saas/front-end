"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "@/app/AppProvider";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logoutFromNextClientToNextServer } from "@/services/auth.service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PortalHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { tokens, setTokens } = useAppContext();
  const isLoggedIn = Boolean(tokens?.accessToken);
  const router = useRouter();

  const navLinks = useMemo(
    () => [
      { label: "Trang chủ", href: "/portal" },
      { label: "Về chúng tôi", href: "/about-us" },
      { label: "Gói thành viên", href: "/subscription" },
    ],
    [],
  );

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    try {
      await logoutFromNextClientToNextServer();
      toast.success("Đăng xuất thành công");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Đăng xuất thất bại");
    } finally {
      setTokens({ accessToken: "", refreshToken: "", expiresAt: "" });
      setIsMenuOpen(false);
      router.replace("/portal");
    }
  };

  return (
    <header className="relative w-full">
      <nav className="grid grid-cols-[1fr_auto_1fr] max-w-7xl mx-auto pt-2 px-6 items-center gap-4">
        <div className="justify-self-start">
          <Link
            href="/portal"
            aria-label="Coffee Portal"
            className="relative inline-flex items-center justify-center w-[220px] h-[80px]"
          >
            <Image
              src="/images/logo1.png"
              alt="Coffee Management"
              fill
              priority
              className="object-contain drop-shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
              sizes="220px"
            />
          </Link>
        </div>

        <div className="hidden md:flex items-center justify-center gap-8 justify-self-center">
          {navLinks.map((link) => (
            <Link
              key={`${link.href}:${link.label}`}
              className="hover:text-white transition-colors text-sm font-medium text-neutral-300"
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 justify-self-end">
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  type="button"
                  aria-label="Tài khoản"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition-colors"
                >
                  <User className="h-5 w-5 text-white/85" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 rounded-xl border border-white/10 bg-neutral-950/90 text-white backdrop-blur-md"
                >
                  <DropdownMenuItem
                    asChild
                    className="cursor-pointer rounded-lg"
                  >
                    <Link
                      href="/profile?tab=personal-info"
                      className="flex items-center gap-2"
                    >
                      <User className="h-4 w-4 text-white/70" />
                      <span>Thông tin cá nhân</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    variant="destructive"
                    className="cursor-pointer rounded-lg"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link
                  href="/system/login"
                  className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 ring-1 ring-white/10 text-sm font-medium transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/system/register"
                  className="inline-flex items-center gap-2 hover:from-amber-400 hover:to-orange-500 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25 active:scale-95 text-sm font-medium text-white tracking-tight bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl py-2.5 px-4"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="md:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition-all duration-300 z-50 relative"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((v) => !v)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`lucide lucide-menu h-5 w-5 transition-all duration-300 ${isMenuOpen ? "opacity-0 -rotate-90" : "opacity-100 rotate-0"}`}
              style={{ strokeWidth: 1.5 }}
            >
              <path d="M4 5h16" />
              <path d="M4 12h16" />
              <path d="M4 19h16" />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`lucide lucide-x h-5 w-5 absolute inset-0 m-auto transition-all duration-300 ${isMenuOpen ? "opacity-100 rotate-0" : "opacity-0 rotate-90"}`}
              style={{ strokeWidth: 1.5 }}
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-40 bg-neutral-950/90 backdrop-blur-md transition-all duration-300 ${isMenuOpen ? "opacity-100 visible scale-100" : "opacity-0 invisible scale-[0.98]"}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsMenuOpen(false);
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/95 to-neutral-900/95" />

        <div className="relative h-full flex flex-col justify-center items-center">
          <nav className="flex flex-col items-center space-y-8 mb-12">
            {navLinks.map((link, idx) => (
              <Link
                key={`${link.href}:${link.label}`}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`text-2xl font-medium text-white hover:text-amber-300 transition-all duration-300 transform hover:scale-110 ${isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                style={{ transitionDelay: `${(idx + 1) * 100}ms` }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {isLoggedIn ? (
            <div
              className={`flex flex-col items-center space-y-3 transition-all duration-300 ${isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              style={{ transitionDelay: `${(navLinks.length + 1) * 100}ms` }}
            >
              <Link
                href="/profile?tab=personal-info"
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex items-center gap-3 px-8 py-3 rounded-xl bg-white/10 hover:bg-white/15 ring-1 ring-white/15 text-lg font-medium text-white transition-all duration-300 hover:scale-105 min-w-[220px] justify-center"
              >
                <User className="h-5 w-5 text-white/85" />
                Thông tin cá nhân
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-3 px-8 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/15 ring-1 ring-red-500/25 text-lg font-medium text-white transition-all duration-300 hover:scale-105 min-w-[220px] justify-center"
              >
                <LogOut className="h-5 w-5 text-red-200/90" />
                Đăng xuất
              </button>
            </div>
          ) : (
            <div
              className={`flex flex-col items-center space-y-4 transition-all duration-300 ${isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              style={{ transitionDelay: `${(navLinks.length + 1) * 100}ms` }}
            >
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="px-8 py-3 rounded-lg bg-white/10 hover:bg-white/20 ring-1 ring-white/20 text-lg font-medium text-white transition-all duration-300 hover:scale-105 min-w-[200px] text-center"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMenuOpen(false)}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-lg font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25 min-w-[200px] text-center"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
