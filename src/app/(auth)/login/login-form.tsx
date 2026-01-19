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
import { useAppContext } from "@/app/AppProvider";

const formSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(32, "Username must be at most 32 characters.")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscore.",
    ),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(100, "Password must be at most 100 characters."),
});

export default function LoginForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  const router = useRouter();
  const { setSessionToken } = useAppContext();
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const payload = {
        username: values.username,
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
        throw new Error(data?.message || `Login failed (${res.status})`);
      }

      console.log("Login success:", data);
      toast("Đăng nhập thành công!");
      const resultFromNextServer = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        }),
      }).then(async (res) => {
        const payload = await res.json();
        const data = {
          status: res.status,
          payload,
        };
        if (!res.ok) {
          throw data;
        }
        return data;
      });
      console.log("abvc", resultFromNextServer);
      setSessionToken(resultFromNextServer.payload.accessToken);

      router.replace("/");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Đăng nhập thất bại, vui lòng thử lại");
    }
  }
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
            {/* Email */}
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
          </FieldGroup>
        </form>
      </CardContent>

      {/* Footer */}
      <CardFooter className="pt-1 pb-4 px-2">
        <Field orientation="horizontal" className="w-full flex justify-center">
          <Button
            type="submit"
            form="form-rhf-demo"
            className="h-8 px-10 text-sm bg-amber-700 hover:bg-amber-800 text-white"
          >
            Đăng nhập ngay
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
