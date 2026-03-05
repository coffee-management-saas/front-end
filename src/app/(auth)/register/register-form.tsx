"use client";
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
import {
  CalendarDays,
  Home,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
  UserPlus,
} from "lucide-react";

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

export default function RegisterForm() {
  const [loading, setLoading] = React.useState(false);
  const [dobType, setDobType] = React.useState<"text" | "date">("text");

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (loading) return;
    setLoading(true);

    try {
      const payload = {
        username: values.username.trim(),
        fullname: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        dob: values.dob,
        password: values.password,
        address: values.address.trim(),
      };

      const res = await fetch(
        `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : null;

      if (!res.ok) {
        throw new Error(data?.message || `Register failed (${res.status})`);
      }

      toast.success("Đăng kí thành công!");
      router.replace("/login");
    } catch (error) {
      console.error("Register error:", error);
      toast.error("Đăng kí thất bại, vui lòng thử lại");
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
      <div className="flex justify-center pt-4 pb-0">
        <div className="flex justify-center pt-1 pb-0 -mb-3">
          <Image
            src="https://i.pinimg.com/736x/9b/41/3e/9b413e743be2d101c400a7b85d6d3e26.jpg"
            alt="Cafe Logo"
            width={64}
            height={64}
            className="h-14 w-14 rounded-full"
            priority
          />
        </div>
      </div>

      {/* Header */}
      <CardHeader className="space-y-0 px-7 pb-0 pt-2 text-center">
        <CardTitle className="text-xl font-semibold tracking-tight text-[#3b2314]">
          Đăng ký
        </CardTitle>
        <CardDescription className="mt-0 text-xs font-medium text-[#B36A2E]">
          Tạo tài khoản mới
        </CardDescription>
      </CardHeader>

      {/* Content */}
      <CardContent className="px-7 pb-0 pt-2">
        <div className="relative mb-2">
          <div className="absolute inset-x-0 top-1/2 h-px bg-[#E6D6C8]" />
          <div className="relative mx-auto w-fit bg-[#F7F1EA] px-3 text-[10px] font-medium tracking-[0.32em] text-[#B9A79B]">
            TÀI KHOẢN
          </div>
        </div>

        <div className="max-h-[40vh] overflow-y-auto pb-1 pr-3 pt-1">
          <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className="gap-2">
              {/* Username */}
              <Controller
                name="username"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-1.5">
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
                        className="h-9 rounded-xl border-[#E6D6C8] bg-white/70 pl-10 text-[#3b2314] placeholder:text-[#B9A79B] focus-visible:border-[#D18B4C] focus-visible:ring-[#D18B4C]/25"
                        disabled={loading}
                      />
                    </div>
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Full name */}
              <Controller
                name="fullName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-1.5">
                    <FieldLabel
                      className="text-[11px] font-semibold tracking-[0.22em] text-[#9E8B7C] uppercase"
                      htmlFor="fullName"
                    >
                      Họ và tên
                    </FieldLabel>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#B9A79B]" />
                      <Input
                        {...field}
                        id="fullName"
                        placeholder="Nguyen Van A"
                        autoComplete="name"
                        aria-invalid={fieldState.invalid}
                        className="h-9 rounded-xl border-[#E6D6C8] bg-white/70 pl-10 text-[#3b2314] placeholder:text-[#B9A79B] focus-visible:border-[#D18B4C] focus-visible:ring-[#D18B4C]/25"
                        disabled={loading}
                      />
                    </div>
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Email */}
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-1.5">
                    <FieldLabel
                      className="text-[11px] font-semibold tracking-[0.22em] text-[#9E8B7C] uppercase"
                      htmlFor="email"
                    >
                      Email
                    </FieldLabel>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#B9A79B]" />
                      <Input
                        {...field}
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        autoComplete="email"
                        aria-invalid={fieldState.invalid}
                        className="h-9 rounded-xl border-[#E6D6C8] bg-white/70 pl-10 text-[#3b2314] placeholder:text-[#B9A79B] focus-visible:border-[#D18B4C] focus-visible:ring-[#D18B4C]/25"
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
                  <Field data-invalid={fieldState.invalid} className="gap-1.5">
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
                        autoComplete="new-password"
                        aria-invalid={fieldState.invalid}
                        className="h-9 rounded-xl border-[#E6D6C8] bg-white/70 pl-10 text-[#3b2314] placeholder:text-[#B9A79B] focus-visible:border-[#D18B4C] focus-visible:ring-[#D18B4C]/25"
                        disabled={loading}
                      />
                    </div>
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Phone */}
              <Controller
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-1.5">
                    <FieldLabel
                      className="text-[11px] font-semibold tracking-[0.22em] text-[#9E8B7C] uppercase"
                      htmlFor="phone"
                    >
                      Số điện thoại
                    </FieldLabel>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#B9A79B]" />
                      <Input
                        {...field}
                        id="phone"
                        type="tel"
                        placeholder="0901234567"
                        autoComplete="tel"
                        aria-invalid={fieldState.invalid}
                        className="h-9 rounded-xl border-[#E6D6C8] bg-white/70 pl-10 text-[#3b2314] placeholder:text-[#B9A79B] focus-visible:border-[#D18B4C] focus-visible:ring-[#D18B4C]/25"
                        disabled={loading}
                      />
                    </div>
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* DOB */}
              <Controller
                name="dob"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-1.5">
                    <FieldLabel
                      className="text-[11px] font-semibold tracking-[0.22em] text-[#9E8B7C] uppercase"
                      htmlFor="dob"
                    >
                      Ngày sinh
                    </FieldLabel>
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#B9A79B]" />
                      <Input
                        {...field}
                        id="dob"
                        type={dobType}
                        placeholder={dobType === "text" ? "dd/mm/yyyy" : ""}
                        className="h-9 rounded-xl border-[#E6D6C8] bg-white/70 pl-10 text-[#3b2314] placeholder:text-[#B9A79B] focus-visible:border-[#D18B4C] focus-visible:ring-[#D18B4C]/25"
                        onFocus={() => !loading && setDobType("date")}
                        onBlur={() => {
                          if (!field.value) setDobType("text");
                        }}
                        autoComplete="bday"
                        disabled={loading}
                      />
                    </div>
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Address */}
              <Controller
                name="address"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-1.5">
                    <FieldLabel
                      className="text-[11px] font-semibold tracking-[0.22em] text-[#9E8B7C] uppercase"
                      htmlFor="address"
                    >
                      Địa chỉ
                    </FieldLabel>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#B9A79B]" />
                      <Input
                        {...field}
                        id="address"
                        placeholder="123 Nguyễn Trãi, Q1, TP.HCM"
                        autoComplete="street-address"
                        aria-invalid={fieldState.invalid}
                        className="h-9 rounded-xl border-[#E6D6C8] bg-white/70 pl-10 text-[#3b2314] placeholder:text-[#B9A79B] focus-visible:border-[#D18B4C] focus-visible:ring-[#D18B4C]/25"
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
        </div>
      </CardContent>

      {/* Footer */}
      <CardFooter className="flex flex-col gap-2.5 px-7 pb-4 pt-3">
        <Field orientation="horizontal" className="w-full">
          <Button
            type="submit"
            form="form-rhf-demo"
            className="h-10 w-full rounded-xl bg-[#7a4a2a] text-white shadow-[0_14px_30px_-18px_rgba(0,0,0,0.65)] hover:bg-[#8b5e44] disabled:opacity-60"
            disabled={isSubmitDisabled}
            aria-disabled={isSubmitDisabled}
            aria-busy={loading}
          >
            <UserPlus className="size-4" />
            {loading ? "Đang đăng ký..." : "Đăng ký ngay"}
          </Button>
        </Field>

        <div className="text-center text-sm text-[#7E6B5C]">
          Đã có tài khoản?{" "}
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
