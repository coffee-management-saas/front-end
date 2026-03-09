"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Script from "next/script";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react";

function toDobYmd(value: string): string {
  const raw = value.trim();
  if (!raw) return "";

  // ISO datetime -> take date part
  if (raw.includes("T")) return raw.slice(0, 10);

  // `YYYY-MM-DD`
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  // `dd/mm/yyyy` -> `yyyy-mm-dd`
  const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  if (dmy) {
    const day = dmy[1];
    const month = dmy[2];
    const year = dmy[3];
    return `${year}-${month}-${day}`;
  }

  return raw;
}

const formSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(32, "Username must be at most 32 characters.")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscore.",
    ),

  fullName: z
    .string()
    .min(5, "Full name must be at least 5 characters.")
    .max(32, "Full name must be at most 32 characters."),

  email: z.string().refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
    message: "Invalid email address.",
  }),

  phone: z
    .string()
    .min(9, "Phone must be at least 9 digits.")
    .max(15, "Phone must be at most 15 digits.")
    .regex(/^[0-9+]+$/, "Phone can only contain numbers and +."),

  address: z
    .string()
    .min(5, "Address must be at least 5 characters.")
    .max(200, "Address must be at most 200 characters."),

  dob: z
    .string()
    .refine((val) => !!val, { message: "Date of birth is required." }),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(100, "Password must be at most 100 characters."),
});

export default function SystemRegisterForm() {
  const [loading, setLoading] = React.useState(false);
  const [dobType, setDobType] = React.useState<"text" | "date">("text");
  const vantaRef = React.useRef<HTMLDivElement | null>(null);
  const vantaEffect = React.useRef<{ destroy?: () => void } | null>(null);
  const [threeLoaded, setThreeLoaded] = React.useState(false);
  const [vantaLoaded, setVantaLoaded] = React.useState(false);
  const [vantaFailed, setVantaFailed] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      fullName: "",
      password: "",
      phone: "",
      email: "",
      address: "",
      dob: "",
    },
    mode: "onTouched",
  });

  const router = useRouter();

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

    const win = window as unknown as {
      THREE?: { Group?: unknown };
      VANTA?: { NET?: (options: unknown) => { destroy?: () => void } };
    };

    if (!win.THREE?.Group) {
      setVantaFailed(true);
      return;
    }

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
        fullname: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        dob: toDobYmd(values.dob),
        password: values.password,
        address: values.address.trim(),
      };

      const res = await fetch("/api/system/auth/register-customer-system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : null;

      if (!res.ok) {
        throw new Error(data?.message || `Register failed (${res.status})`);
      }

      toast.success("Đăng kí thành công!");
      router.replace("/system/login");
    } catch (error) {
      console.error("Register error:", error);
      toast.error("Đăng kí thất bại, vui lòng thử lại");
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
            className={`h-[130px] relative ${vantaFailed ? "bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.18)_0%,rgba(18,10,6,0.92)_60%,rgba(18,10,6,1)_100%)]" : ""}`}
            id="vanta-canvas"
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
                Đăng kí ngay
              </h3>

              <form
                className="space-y-3 mb-6 max-h-[62vh] overflow-y-auto pr-1"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <Controller
                  name="username"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <div>
                      <label
                        htmlFor="username"
                        className="text-amber-50/80 text-xs font-medium block mb-1"
                      >
                        TÊN ĐĂNG NHẬP
                      </label>
                      <input
                        {...field}
                        id="username"
                        type="text"
                        autoComplete="username"
                        placeholder="username"
                        className="w-full bg-[#1f120c] border border-white/10 rounded-lg px-4 py-1.5 text-amber-50/90 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm placeholder:text-amber-50/35"
                        aria-invalid={fieldState.invalid}
                        disabled={loading}
                      />
                      {fieldState.error?.message && (
                        <p className="mt-1 text-xs text-red-300">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="fullName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <div>
                      <label
                        htmlFor="fullName"
                        className="text-amber-50/80 text-xs font-medium block mb-1"
                      >
                        HỌ VÀ TÊN
                      </label>
                      <input
                        {...field}
                        id="fullName"
                        type="text"
                        autoComplete="name"
                        placeholder="Nguyễn Văn A"
                        className="w-full bg-[#1f120c] border border-white/10 rounded-lg px-4 py-1.5 text-amber-50/90 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm placeholder:text-amber-50/35"
                        aria-invalid={fieldState.invalid}
                        disabled={loading}
                      />
                      {fieldState.error?.message && (
                        <p className="mt-1 text-xs text-red-300">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Controller
                    name="email"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <div>
                        <label
                          htmlFor="email"
                          className="text-amber-50/80 text-xs font-medium block mb-1"
                        >
                          EMAIL
                        </label>
                        <input
                          {...field}
                          id="email"
                          type="email"
                          autoComplete="email"
                          placeholder="email@example.com"
                          className="w-full bg-[#1f120c] border border-white/10 rounded-lg px-4 py-1.5 text-amber-50/90 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm placeholder:text-amber-50/35"
                          aria-invalid={fieldState.invalid}
                          disabled={loading}
                        />
                        {fieldState.error?.message && (
                          <p className="mt-1 text-xs text-red-300">
                            {fieldState.error.message}
                          </p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="password"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <div>
                        <label
                          htmlFor="password"
                          className="text-amber-50/80 text-xs font-medium block mb-1"
                        >
                          MẬT KHẨU
                        </label>
                        <input
                          {...field}
                          id="password"
                          type="password"
                          autoComplete="new-password"
                          placeholder="••••••••"
                          className="w-full bg-[#1f120c] border border-white/10 rounded-lg px-4 py-1.5 text-amber-50/90 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm placeholder:text-amber-50/35"
                          aria-invalid={fieldState.invalid}
                          disabled={loading}
                        />
                        {fieldState.error?.message && (
                          <p className="mt-1 text-xs text-red-300">
                            {fieldState.error.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Controller
                    name="phone"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <div>
                        <label
                          htmlFor="phone"
                          className="text-amber-50/80 text-xs font-medium block mb-1"
                        >
                          SỐ ĐIỆN THOẠI
                        </label>
                        <input
                          {...field}
                          id="phone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="0901234567"
                          className="w-full bg-[#1f120c] border border-white/10 rounded-lg px-4 py-1.5 text-amber-50/90 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm placeholder:text-amber-50/35"
                          aria-invalid={fieldState.invalid}
                          disabled={loading}
                        />
                        {fieldState.error?.message && (
                          <p className="mt-1 text-xs text-red-300">
                            {fieldState.error.message}
                          </p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="dob"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <div>
                        <label
                          htmlFor="dob"
                          className="text-amber-50/80 text-xs font-medium block mb-1"
                        >
                          NGÀY SINH
                        </label>
                        <input
                          {...field}
                          id="dob"
                          type={dobType}
                          placeholder={dobType === "text" ? "dd/mm/yyyy" : ""}
                          onFocus={() => !loading && setDobType("date")}
                          onBlur={() => {
                            if (!field.value) setDobType("text");
                          }}
                          autoComplete="bday"
                          className="w-full bg-[#1f120c] border border-white/10 rounded-lg px-4 py-1.5 text-amber-50/90 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm placeholder:text-amber-50/35"
                          aria-invalid={fieldState.invalid}
                          disabled={loading}
                        />
                        {fieldState.error?.message && (
                          <p className="mt-1 text-xs text-red-300">
                            {fieldState.error.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                </div>

                <Controller
                  name="address"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <div>
                      <label
                        htmlFor="address"
                        className="text-amber-50/80 text-xs font-medium block mb-1"
                      >
                        ĐỊA CHỈ
                      </label>
                      <input
                        {...field}
                        id="address"
                        type="text"
                        autoComplete="street-address"
                        placeholder="123 Nguyễn Trãi, Q1, TP.HCM"
                        className="w-full bg-[#1f120c] border border-white/10 rounded-lg px-4 py-1.5 text-amber-50/90 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm placeholder:text-amber-50/35"
                        aria-invalid={fieldState.invalid}
                        disabled={loading}
                      />
                      {fieldState.error?.message && (
                        <p className="mt-1 text-xs text-red-300">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />

                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="w-full px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 disabled:opacity-60 disabled:cursor-not-allowed hover:from-amber-400 hover:to-orange-500 text-[#1a120d] rounded-lg transition font-semibold shadow-[0_18px_60px_rgba(245,158,11,0.18)]"
                >
                  {loading ? "Đang đăng kí..." : "Đăng kí"}
                </button>
              </form>
            </div>

            <div className="pt-2 text-center">
              <div className="h-px bg-[linear-gradient(to_right,transparent,rgba(245,158,11,0.35),transparent)] mb-4" />
              <p className="text-amber-100/60 text-xs">
                Đã có tài khoản?{" "}
                <Link href="/system/login" className="text-amber-200 hover:underline">
                  Đăng nhập
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
