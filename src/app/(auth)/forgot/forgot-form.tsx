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
import Link from "next/link";
import { useAppContext } from "@/app/AppProvider";
import { Home, KeyRound, Lock } from "lucide-react";

const formSchema = z
  .object({
    oldPassword: z.string().min(1, "Vui lòng nhập mật khẩu cũ."),
    newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự."),
    confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu mới."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu xác nhận không khớp.",
  });

function parseMessageFromResponse(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === "string") return parsed;
      if (parsed && typeof parsed === "object" && "message" in parsed) {
        const msg = (parsed as { message?: unknown }).message;
        if (typeof msg === "string") return msg;
      }
    } catch {
      // ignore
    }
  }

  return trimmed;
}

export default function ForgotForm() {
  const [loading, setLoading] = React.useState(false);
  const { accessToken } = useAppContext();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (loading) return;
    setLoading(true);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

      const res = await fetch(
        `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/auth/change-password`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(values),
        },
      );

      const raw = await res.text();
      const message =
        parseMessageFromResponse(raw) ||
        (res.ok ? "Thay đổi mật khẩu thành công" : "");

      if (!res.ok) {
        if (res.status === 400 || res.status === 401) {
          form.setError("oldPassword", {
            type: "manual",
            message:
              message || "Mật khẩu cũ không đúng hoặc yêu cầu không hợp lệ.",
          });
          return;
        }
        throw new Error(message || `Đổi mật khẩu thất bại (${res.status})`);
      }

      toast.success(message);
      form.reset();
    } catch (error) {
      console.error("Change password error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Đổi mật khẩu thất bại, vui lòng thử lại",
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
      <div className="flex justify-center pb-0 pt-7">
        <div className="-mb-4 flex justify-center pb-0 pt-2">
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
          Đổi mật khẩu
        </CardTitle>
        <CardDescription className="mt-0 text-sm font-medium text-[#B36A2E]">
          Cập nhật mật khẩu mới cho tài khoản
        </CardDescription>
      </CardHeader>

      {/* Content */}
      <CardContent className="px-8 pb-0 pt-4">
        <div className="relative mb-4">
          <div className="absolute inset-x-0 top-1/2 h-px bg-[#E6D6C8]" />
          <div className="relative mx-auto w-fit bg-[#F7F1EA] px-3 text-[11px] font-medium tracking-[0.32em] text-[#B9A79B]">
            BẢO MẬT
          </div>
        </div>

        <form id="form-change-password" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            <Controller
              name="oldPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-2">
                  <FieldLabel
                    className="text-[11px] font-semibold tracking-[0.22em] text-[#9E8B7C] uppercase"
                    htmlFor="oldPassword"
                  >
                    Mật khẩu cũ
                  </FieldLabel>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#B9A79B]" />
                    <Input
                      {...field}
                      id="oldPassword"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
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

            <Controller
              name="newPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-2">
                  <FieldLabel
                    className="text-[11px] font-semibold tracking-[0.22em] text-[#9E8B7C] uppercase"
                    htmlFor="newPassword"
                  >
                    Mật khẩu mới
                  </FieldLabel>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#B9A79B]" />
                    <Input
                      {...field}
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
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

            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-2">
                  <FieldLabel
                    className="text-[11px] font-semibold tracking-[0.22em] text-[#9E8B7C] uppercase"
                    htmlFor="confirmPassword"
                  >
                    Xác nhận mật khẩu mới
                  </FieldLabel>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#B9A79B]" />
                    <Input
                      {...field}
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
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
          </FieldGroup>
        </form>
      </CardContent>

      {/* Footer */}
      <CardFooter className="flex flex-col gap-4 px-8 pb-6 pt-5">
        <Field orientation="horizontal" className="w-full">
          <Button
            type="submit"
            form="form-change-password"
            className="h-11 w-full rounded-xl bg-[#7a4a2a] text-white shadow-[0_14px_30px_-18px_rgba(0,0,0,0.65)] hover:bg-[#8b5e44] disabled:opacity-60"
            disabled={isSubmitDisabled}
            aria-disabled={isSubmitDisabled}
            aria-busy={loading}
          >
            <KeyRound className="size-4" />
            {loading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
          </Button>
        </Field>

        <div className="text-center text-sm text-[#7E6B5C]">
          Quay lại{" "}
          <Link
            href="/login"
            className="font-semibold text-[#B36A2E] hover:text-[#8E4E24] hover:underline"
          >
            Đăng nhập
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
