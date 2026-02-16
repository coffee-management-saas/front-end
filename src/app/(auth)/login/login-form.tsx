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
    .min(3, "Username must be at least 3 characters.")
    .max(32, "Username must be at most 32 characters.")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscore.",
    ),
  password: z.string(),
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
      const expiresAt = getJwtExpiresAt(data.accessToken);
      if (!res.ok) {
        throw new Error(data?.message || `Login failed (${res.status})`);
      }

      // toast.success("Đăng nhập thành công!");

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
      const destination =
        role === "SHOP" ? "/staff" : role === "SYSTEM" ? "/admin" : "/";

      router.replace(destination);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Đăng nhập thất bại, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  }

  const isSubmitDisabled = loading || !form.formState.isValid;

  return (
    <Card className="w-full sm:max-w-sm p-0 max-h-[90vh] overflow-hidden">
      {/* Logo */}
      <div className="flex justify-center pt-2 pb-0 -mb-4">
        <Image
          src="https://i.pinimg.com/1200x/fc/da/b7/fcdab7e591105149942a91cea82afbf1.jpg"
          alt="Cafe Logo"
          width={72}
          height={72}
          className="h-16 w-16 rounded-full"
          priority
        />
      </div>

      {/* Header */}
      <CardHeader className="pt-0 pb-0 px-4 space-y-0">
        <CardTitle className="text-xl font-bold text-center">
          Đăng nhập
        </CardTitle>
        <CardDescription className="text-sm font-semibold text-center">
          Chào mừng bạn quay lại
        </CardDescription>
      </CardHeader>

      {/* Content */}
      <CardContent className="pt-0 pb-2 px-4 overflow-y-auto max-h-[65vh]">
        <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="space-y-0">
            {/* Username */}
            <Controller
              name="username"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="space-y-0">
                  <FieldLabel className="text-sm mb-0" htmlFor="username">
                    Tên đăng nhập
                  </FieldLabel>
                  <Input
                    {...field}
                    id="username"
                    placeholder="nguyenvana"
                    autoComplete="username"
                    aria-invalid={fieldState.invalid}
                    className="h-10 text-base placeholder:text-sm"
                    disabled={loading}
                  />
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
                <Field data-invalid={fieldState.invalid} className="space-y-0">
                  <FieldLabel className="text-sm mb-0" htmlFor="password">
                    Mật khẩu
                  </FieldLabel>
                  <Input
                    {...field}
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    aria-invalid={fieldState.invalid}
                    className="h-10 text-base placeholder:text-sm"
                    disabled={loading}
                  />
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
      <CardFooter className="pt-1 pb-4 px-2 flex flex-col gap-4">
        <Field orientation="horizontal" className="w-full flex justify-center">
          <Button
            type="submit"
            form="form-rhf-demo"
            className="h-8 px-10 text-sm bg-amber-700 hover:bg-amber-800 text-white"
            disabled={isSubmitDisabled}
            aria-disabled={isSubmitDisabled}
            aria-busy={loading}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập ngay"}
          </Button>
        </Field>

        <div className="text-center text-sm">
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="font-semibold text-amber-700 hover:text-amber-800 hover:underline"
          >
            Đăng ký ngay
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
