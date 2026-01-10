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

const formSchema = z.object({
  phone: z.string().refine((val) => /^(0|\+84)[0-9]{9,10}$/.test(val), {
    message: "Số điện thoại không hợp lệ.",
  }),
});

export default function VerificationPhoneForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: "",
    },
  });
  // 2. Define a submit handler ( Nơi gắn api)
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const res = await fetch(
        `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/auth/login`,
        {
          body: JSON.stringify(values),
          headers: {
            "Content-Type": "application/json",
          },

          method: "POST",
        }
      ).then(async (res) => {
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

      // Lưu thông tin user vào localStorage
      if (res.payload && res.payload.user) {
        localStorage.setItem("user", JSON.stringify(res.payload.user));
        // Có thể redirect về home hoặc user page
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  }
  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          F&B Coffee Xin Chào
        </CardTitle>
        <CardDescription className="font-bold text-center">
          Đăng kí / Đăng nhập
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="phone">Số điện thoại</FieldLabel>
                  <Input
                    {...field}
                    id="phone"
                    type="tel"
                    placeholder="Nhập số điện thoại"
                    autoComplete="tel"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal" className="w-full flex justify-center">
          <Button type="submit" form="form-rhf-demo" className="px-8 py-3">
            Tiếp tục
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
