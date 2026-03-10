"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Script from "next/script";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/AppProvider";
import { getJwtExpiresAt } from "@/lib/utils";
import { Home } from "lucide-react";

function getRoleFromAccessToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const payload = JSON.parse(atob(padded));

    const rawRole =
      payload?.role ??
      (Array.isArray(payload?.roles) ? payload.roles[0] : null) ??
      (Array.isArray(payload?.authorities) ? payload.authorities[0] : null);

    if (!rawRole) return null;

    const normalized = String(rawRole).toUpperCase();
    return normalized.startsWith("ROLE_") ? normalized.slice(5) : normalized;
  } catch {
    return null;
  }
}
const formSchema = z.object({
  username: z
    .string()
    .min(5, "Tên đăng nhập phải có ít nhất 5 ký tự.")
    .max(32, "Tên đăng nhập tối đa 32 ký tự.")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Tên đăng nhập chỉ chứa chữ cái, số và dấu gạch dưới.",
    ),
  password: z.string().min(1, "Vui lòng nhập mật khẩu."),
});

export default function SystemLoginForm() {
  const [loading, setLoading] = React.useState(false);
  const vantaRef = React.useRef<HTMLDivElement | null>(null);
  const vantaEffect = React.useRef<{ destroy?: () => void } | null>(null);
  const [threeLoaded, setThreeLoaded] = React.useState(false);
  const [vantaLoaded, setVantaLoaded] = React.useState(false);
  const [vantaFailed, setVantaFailed] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
    mode: "onTouched",
  });

  const router = useRouter();
  const { setTokens } = useAppContext();

  React.useEffect(() => {
    const win = window as unknown as {
      THREE?: { Group?: unknown };
      VANTA?: { NET?: unknown };
    };
    if (win.THREE?.Group) setThreeLoaded(true);
    if (win.VANTA?.NET) setVantaLoaded(true);
  }, []);

  React.useEffect(() => {
    if (vantaFailed) return;
    if (!threeLoaded || !vantaLoaded) return;
    if (!vantaRef.current) return;
    if (vantaEffect.current) return;

    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    )?.matches;
    if (prefersReducedMotion) return;

    const { width, height } = vantaRef.current.getBoundingClientRect();
    if (width < 10 || height < 10) return;

    const canUseWebGL = (() => {
      try {
        if (!window.WebGLRenderingContext) return false;
        const canvas = document.createElement("canvas");
        return Boolean(
          canvas.getContext("webgl") || canvas.getContext("experimental-webgl"),
        );
      } catch {
        return false;
      }
    })();

    if (!canUseWebGL) {
      setVantaFailed(true);
      return;
    }

    const win = window as unknown as {
      THREE?: { Group?: unknown };
      VANTA?: { NET?: (options: unknown) => { destroy?: () => void } };
    };

    if (!win.THREE?.Group) {
      setVantaFailed(true);
      return;
    }

    if (!win.VANTA?.NET) return;

    try {
      vantaEffect.current = win.VANTA.NET({
        el: vantaRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 130,
        minWidth: 200,
        scale: 1.0,
        scaleMobile: 1.0,
        color: 0xd97706,
        backgroundColor: 0x120a06,
        points: 8,
        maxDistance: 20.0,
        spacing: 18.0,
        showDots: true,
      });
    } catch (e) {
      setVantaFailed(true);
      console.error(e);
      vantaEffect.current?.destroy?.();
      vantaEffect.current = null;
      return;
    }

    return () => {
      vantaEffect.current?.destroy?.();
      vantaEffect.current = null;
    };
  }, [threeLoaded, vantaLoaded, vantaFailed]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (loading) return;
    setLoading(true);

    try {
      const payload = {
        username: values.username.trim(),
        password: values.password,
      };

      const res = await fetch("/api/system/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401 || res.status === 400) {
          form.setError("password", {
            type: "manual",
            message: "Tên đăng nhập hoặc mật khẩu không chính xác",
          });
          // Also mark username as invalid visually if desired, but msg is under password
          form.setError("username", {
            type: "manual",
            message: " ",
          });
          return;
        }

        throw new Error(data?.message || `Lỗi đăng nhập (${res.status})`);
      }

      const role = getRoleFromAccessToken(data.accessToken);
      if (role !== "SYSTEM" && role !== "CUSTOMER_SYSTEM") {
        form.setError("password", {
          type: "manual",
          message: "Tài khoản không có quyền truy cập",
        });
        form.setError("username", {
          type: "manual",
          message: " ",
        });
        toast.error("Tài khoản không có quyền truy cập");
        return;
      }

      const expiresAt = getJwtExpiresAt(data.accessToken);

      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        }),
      }).then(async (res) => {
        const payload = await res.json();
        const resultFromNextServer = { status: res.status, payload };
        if (!res.ok) throw resultFromNextServer;
        return resultFromNextServer;
      });

      // setTokens phải lấy từ data (login backend), không phải từ /api/auth
      setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt,
      });

      router.replace(role === "SYSTEM" ? "/system" : "/portal");
    } catch (error) {
      console.error("Login error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Đăng nhập thất bại, vui lòng thử lại",
      );
    } finally {
      setLoading(false);
    }
  }

  const isSubmitDisabled = loading || !form.formState.isValid;

  return (
    <>
      <Script
        id="threejs-r134"
        src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"
        strategy="afterInteractive"
        onLoad={() => setThreeLoaded(true)}
      />
      {threeLoaded ? (
        <Script
          id="vanta-net"
          src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js"
          strategy="afterInteractive"
          onLoad={() => setVantaLoaded(true)}
        />
      ) : null}

      <div className="max-w-sm w-full relative z-0 before:content-[''] before:absolute before:-inset-px before:bg-[linear-gradient(to_bottom_right,#a16207,transparent,#2a1a12)] before:rounded-xl before:-z-10">
        <div className="rounded-xl overflow-hidden bg-[#120a06] shadow-lg backdrop-blur-sm ring-1 ring-white/5">
          <Link
            href="/"
            aria-label="Về trang chủ"
            className="absolute left-4 top-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#24160f]/80 ring-1 ring-amber-200/10 hover:bg-[#2a1a12]/80 transition-colors"
          >
            <Home className="h-4 w-4 text-amber-50/90" />
          </Link>

          <div
            ref={vantaRef}
            id="vanta-canvas"
            className={`h-[130px] relative ${vantaFailed ? "bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.18)_0%,rgba(18,10,6,0.92)_60%,rgba(18,10,6,1)_100%)]" : ""}`}
          >
            <div className="absolute top-4 left-4 z-10">
              <span className="px-2 py-1 bg-[#24160f]/75 rounded-full text-xs text-amber-100/70 mb-2 inline-block ring-1 ring-amber-200/10">
                FUTURE&BETTER
              </span>

              <div className="h-1 w-12 bg-amber-400/80 mt-2 rounded-full" />
            </div>
          </div>

          <div className="p-5 flex flex-col bg-[#160d09]">
            <div>
              <h3 className="text-lg font-semibold text-amber-50/90 mb-4">
                Đăng nhập ngay
              </h3>

              <form
                className="space-y-4 mb-6"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <div>
                  <label
                    htmlFor="username"
                    className="text-amber-50/80 text-xs font-medium block mb-1"
                  >
                    TÊN ĐĂNG NHẬP
                  </label>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    placeholder="username"
                    className="w-full bg-[#1f120c] border border-white/10 rounded-lg px-4 py-1.5 text-amber-50/90 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm placeholder:text-amber-50/35"
                    aria-invalid={!!form.formState.errors.username}
                    disabled={loading}
                    {...form.register("username")}
                  />
                  {form.formState.errors.username?.message?.trim() && (
                    <p className="mt-1 text-xs text-red-300">
                      {form.formState.errors.username.message}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label
                      htmlFor="password"
                      className="text-amber-50/80 text-xs font-medium"
                    >
                      MẬT KHẨU
                    </label>
                    <Link
                      href="/forgot"
                      className="text-amber-100/60 text-xs hover:text-amber-100 transition-colors"
                    >
                      Quên mật khẩu ?
                    </Link>
                  </div>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full bg-[#1f120c] border border-white/10 rounded-lg px-4 py-1.5 text-amber-50/90 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm placeholder:text-amber-50/35"
                    aria-invalid={!!form.formState.errors.password}
                    disabled={loading}
                    {...form.register("password")}
                  />
                  {form.formState.errors.password?.message?.trim() && (
                    <p className="mt-1 text-xs text-red-300">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-between text-sm space-x-3 pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitDisabled}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 disabled:opacity-60 disabled:cursor-not-allowed hover:from-amber-400 hover:to-orange-500 text-[#1a120d] rounded-lg transition flex items-center justify-center font-semibold shadow-[0_18px_60px_rgba(245,158,11,0.18)]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                      />
                    </svg>
                    {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-6 pt-4 text-center">
              <div className="h-px bg-[linear-gradient(to_right,transparent,rgba(245,158,11,0.35),transparent)] mb-4" />
              <p className="text-amber-100/60 text-xs">
                Bạn chưa có tài khoản ?{" "}
                <Link
                  href="/system/register"
                  className="text-amber-200 hover:underline"
                >
                  Đăng kí ngay
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
