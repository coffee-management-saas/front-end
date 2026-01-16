"use client";
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
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
const formSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(32, "Username must be at most 32 characters.")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscore."
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
  });
  const [dobType, setDobType] = React.useState<"text" | "date">("text");

  const router = useRouter();
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const payload = {
        username: values.username,
        fullname: values.fullName,
        email: values.email,
        phone: values.phone,
        dob: values.dob,
        password: values.password,
        address: values.address,
      };

      const res = await fetch(
        `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : null;
      if (!res.ok) {
        throw new Error(data?.message || `Register failed (${res.status})`);
      }

      console.log("Register success:", data);
      router.replace("/login");
    } catch (error) {
      console.error("Register error:", error);
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex items-center justify-center p-4">
      <Card className="w-full sm:max-w-sm p-0 max-h-[90vh] overflow-hidden">
        <div className="flex justify-center pt-2 pb-0 -mb-4">
          <Image
            src="https://i.pinimg.com/1200x/fc/da/b7/fcdab7e591105149942a91cea82afbf1.jpg"
            alt="Cafe Logo"
            width={72}
            height={72}
            className="h-16 w-16 rounded-full"
          />
        </div>
        <CardHeader className="pt-0 pb-0 px-4 space-y-0">
          <CardTitle className="text-xl font-bold text-center">
            Đăng ký
          </CardTitle>
          <CardDescription className="text-sm font-semibold text-center">
            Chào mừng bạn đến với Cafe
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0 pb-2 px-4 overflow-y-auto max-h-[65vh]">
          <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Giảm khoảng cách giữa các field */}
            <FieldGroup className="space-y-0">
              {/* Username */}
              <Controller
                name="username"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-0"
                  >
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
                    />

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
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-0"
                  >
                    <FieldLabel className="text-sm mb-0" htmlFor="fullName">
                      Họ và tên
                    </FieldLabel>
                    <Input
                      {...field}
                      id="fullName"
                      placeholder="Nguyen Van A"
                      autoComplete="name"
                      aria-invalid={fieldState.invalid}
                      className="h-10 text-base placeholder:text-sm"
                    />
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Email + Password cùng 1 dòng */}
              <div className="grid grid-cols-2 gap-1.5">
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="space-y-0"
                    >
                      <FieldLabel className="text-sm mb-0" htmlFor="email">
                        Email
                      </FieldLabel>
                      <Input
                        {...field}
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        autoComplete="email"
                        aria-invalid={fieldState.invalid}
                        className="h-10 text-base placeholder:text-sm"
                      />
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="space-y-0"
                    >
                      <FieldLabel className="text-sm mb-0" htmlFor="password">
                        Mật khẩu
                      </FieldLabel>
                      <Input
                        {...field}
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        aria-invalid={fieldState.invalid}
                        className="h-10 text-base placeholder:text-sm"
                      />
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              {/* Phone + DOB on one row (giảm gap) */}
              <div className="grid grid-cols-2 gap-1.5">
                <Controller
                  name="phone"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="space-y-0"
                    >
                      <FieldLabel className="text-sm mb-0" htmlFor="phone">
                        SĐT
                      </FieldLabel>
                      <Input
                        {...field}
                        id="phone"
                        type="tel"
                        placeholder="0901234567"
                        autoComplete="tel"
                        aria-invalid={fieldState.invalid}
                        className="h-10 text-base placeholder:text-sm"
                      />
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="dob"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="space-y-0"
                    >
                      <FieldLabel className="text-sm mb-0" htmlFor="dob">
                        Ngày sinh
                      </FieldLabel>
                      <Input
                        {...field}
                        id="dob"
                        type={dobType}
                        placeholder={dobType === "text" ? "dd/mm/yyyy" : ""}
                        className="h-10 text-base placeholder:text-sm"
                        onFocus={() => setDobType("date")}
                        onBlur={() => {
                          if (!field.value) setDobType("text");
                        }}
                      />

                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              {/* Address */}
              <Controller
                name="address"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-0"
                  >
                    <FieldLabel className="text-sm mb-0" htmlFor="address">
                      Địa chỉ
                    </FieldLabel>
                    <Input
                      {...field}
                      id="address"
                      placeholder="123 Nguyễn Trãi, Q1, TP.HCM"
                      autoComplete="street-address"
                      aria-invalid={fieldState.invalid}
                      className="h-10 text-base placeholder:text-sm"
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

        <CardFooter className="pt-1 pb-4 px-2">
          <Field
            orientation="horizontal"
            className="w-full flex justify-center"
          >
            <Button
              type="submit"
              form="form-rhf-demo"
              className="h-8 px-10 text-sm bg-amber-700 hover:bg-amber-800 text-white"
            >
              Đăng kí ngay
            </Button>
          </Field>
        </CardFooter>
      </Card>
    </div>
  );
}
