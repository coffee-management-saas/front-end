"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import envConfig from "@/config";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppContext } from "@/app/AppProvider";
import { getJwtExpiresAt } from "@/lib/utils";
import { Home, Lock, LogIn, User } from "lucide-react";

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

export default function LoginForm() {
  const [loading, setLoading] = React.useState(false);

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (loading) return;
    setLoading(true);

    try {
      const payload = {
        username: values.username.trim(),
        password: values.password,
      };

      const res = await fetch(
        `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

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

      const role = getRoleFromAccessToken(data.accessToken);
      const destination = (() => {
        switch (role) {
          case "EMPLOYEE":
            return "/staff/menu";
          case "SHOP":
            return "/admin";

          default:
            return "/";
        }
      })();

      router.replace(destination);
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
    <Card className="relative w-full max-w-[400px] gap-0 overflow-hidden rounded-[28px] border-0 bg-[#F7F1EA] p-0 py-0 shadow-[0_28px_80px_-28px_rgba(0,0,0,0.65)]">
      <Button
        asChild
        variant="ghost"
        size="icon-sm"
        className="absolute left-2 top-2 z-10 rounded-full bg-white/60 text-[#3b2314] backdrop-blur hover:bg-white/80"
      >
        <Link href="/" aria-label="Về trang chủ">
          <Home className="size-4" />
        </Link>
      </Button>
      {/* Logo */}
      <div className="flex justify-center pt-7 pb-0">
        <div className="flex justify-center pt-2 pb-0 -mb-4">
          <Image
            src="https://i.pinimg.com/736x/9b/41/3e/9b413e743be2d101c400a7b85d6d3e26.jpg"
            alt="Cafe Logo"
            width={72}
            height={72}
            className="h-16 w-16 rounded-full"
            priority
          />
        </div>
      </div>

      {/* Header */}
      <CardHeader className="space-y-0 px-8 pb-0 pt-4 text-center">
        <CardTitle className="text-2xl font-semibold tracking-tight text-[#3b2314]">
          Đăng nhập
        </CardTitle>
        <CardDescription className="mt-0 text-sm font-medium text-[#B36A2E]">
          Chào mừng bạn quay lại
        </CardDescription>
      </CardHeader>

      {/* Content */}
      <CardContent className="px-8 pb-0 pt-4">
        <div className="relative mb-4">
          <div className="absolute inset-x-0 top-1/2 h-px bg-[#E6D6C8]" />
          <div className="relative mx-auto w-fit bg-[#F7F1EA] px-3 text-[11px] font-medium tracking-[0.32em] text-[#B9A79B]">
            TÀI KHOẢN
          </div>
        </div>
        <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            {/* Username */}
            <Controller
              name="username"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-2">
                  <FieldLabel
                    className="text-[11px] font-semibold tracking-[0.22em] text-[#9E8B7C] uppercase"
                    htmlFor="username"
                  >
                    Tên đăng nhập
                  </FieldLabel>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#B9A79B]" />
                    <Input
                      {...field}
                      id="username"
                      placeholder="nguyenvana"
                      autoComplete="username"
                      aria-invalid={fieldState.invalid}
                      className="h-10 rounded-xl border-[#E6D6C8] bg-white/70 pl-10 text-[#3b2314] placeholder:text-[#B9A79B] focus-visible:border-[#D18B4C] focus-visible:ring-[#D18B4C]/25"
                      disabled={loading}
                    />
                  </div>
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Password */}
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-2">
                  <FieldLabel
                    className="text-[11px] font-semibold tracking-[0.22em] text-[#9E8B7C] uppercase"
                    htmlFor="password"
                  >
                    Mật khẩu
                  </FieldLabel>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#B9A79B]" />
                    <Input
                      {...field}
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      aria-invalid={fieldState.invalid}
                      className="h-10 rounded-xl border-[#E6D6C8] bg-white/70 pl-10 text-[#3b2314] placeholder:text-[#B9A79B] focus-visible:border-[#D18B4C] focus-visible:ring-[#D18B4C]/25"
                      disabled={loading}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Link
                      href="/forgot"
                      className="text-xs font-medium text-[#B36A2E] hover:text-[#8E4E24]"
                      aria-disabled={loading}
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>

      {/* Footer */}
      <CardFooter className="flex flex-col gap-4 px-8 pb-6 pt-5">
        <Field orientation="horizontal" className="w-full">
          <Button
            type="submit"
            form="form-rhf-demo"
            className="h-11 w-full rounded-xl  bg-[#7a4a2a] text-white shadow-[0_14px_30px_-18px_rgba(0,0,0,0.65)] hover:bg-[#8b5e44] disabled:opacity-60"
            disabled={isSubmitDisabled}
            aria-disabled={isSubmitDisabled}
            aria-busy={loading}
          >
            <LogIn className="size-4" />
            {loading ? "Đang đăng nhập..." : "Đăng nhập ngay"}
          </Button>
        </Field>

        <div className="text-center text-sm text-[#7E6B5C]">
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#B36A2E] hover:text-[#8E4E24] hover:underline"
          >
            Đăng ký ngay
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
