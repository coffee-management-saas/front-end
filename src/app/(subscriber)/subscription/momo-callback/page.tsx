"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { PortalFooter } from "@/components/portal/PortalFooter";

type PaymentStatus = "loading" | "success" | "failed";

export default function MomoCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const resultCode = searchParams.get("resultCode");
  const orderId = searchParams.get("orderId") ?? "";
  const status: PaymentStatus = resultCode
    ? resultCode === "0"
      ? "success"
      : "failed"
    : "loading";

  // Äáº¿m ngÆ°á»£c vÃ  tá»± redirect vá» trang chá»§
  useEffect(() => {
    if (status === "loading") return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/subscription");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, router]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0f0a07] text-white flex flex-col">
      <PortalHeader />

      <div className="flex-1 flex items-center justify-center px-6 py-20">
        {status === "loading" ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            <p className="text-neutral-400 text-sm">
              Äang xá»­ lÃ½ káº¿t quáº£ thanh toÃ¡n...
            </p>
          </div>
        ) : status === "success" ? (
          <div className="flex flex-col items-center text-center max-w-md gap-6">
            {/* Icon thÃ nh cÃ´ng */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl scale-150" />
              <div className="relative w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-emerald-400">
                Thanh toÃ¡n thÃ nh cÃ´ng!
              </h1>
              <p className="text-neutral-300">
                GÃ³i Ä‘Äƒng kÃ½ cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c kÃ­ch hoáº¡t. Cáº£m Æ¡n báº¡n Ä‘Ã£ tin tÆ°á»Ÿng
                sá»­ dá»¥ng dá»‹ch vá»¥.
              </p>
              {orderId && (
                <p className="text-xs text-neutral-500 font-mono mt-2">
                  MÃ£ giao dá»‹ch: {orderId}
                </p>
              )}
            </div>

            <div className="w-full rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-4 space-y-1">
              <p className="text-sm text-emerald-300 font-medium">
                âœ“ TÃ i khoáº£n Ä‘Ã£ Ä‘Æ°á»£c táº¡o
              </p>
              <p className="text-sm text-emerald-300 font-medium">
                âœ“ GÃ³i dá»‹ch vá»¥ Ä‘Ã£ Ä‘Æ°á»£c kÃ­ch hoáº¡t
              </p>
              <p className="text-sm text-emerald-300 font-medium">
                âœ“ Email xÃ¡c nháº­n Ä‘Ã£ Ä‘Æ°á»£c gá»­i
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => router.push("/subscription")}
                className="w-full rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-3 px-6 transition-colors"
              >
                Quay vá» trang gÃ³i dá»‹ch vá»¥
              </button>
              <p className="text-xs text-neutral-500">
                Tá»± Ä‘á»™ng chuyá»ƒn hÆ°á»›ng sau {countdown} giÃ¢y...
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center max-w-md gap-6">
            {/* Icon tháº¥t báº¡i */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-red-500/20 blur-2xl scale-150" />
              <div className="relative w-24 h-24 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-red-400">
                Thanh toÃ¡n tháº¥t báº¡i
              </h1>
              <p className="text-neutral-300">
                Giao dá»‹ch khÃ´ng thá»ƒ hoÃ n thÃ nh. Vui lÃ²ng kiá»ƒm tra láº¡i thÃ´ng tin
                thanh toÃ¡n vÃ  thá»­ láº¡i.
              </p>
              {orderId && (
                <p className="text-xs text-neutral-500 font-mono mt-2">
                  MÃ£ giao dá»‹ch: {orderId}
                </p>
              )}
            </div>

            <div className="w-full rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-4 space-y-1">
              <p className="text-sm text-red-300/90">
                Giao dá»‹ch cÃ³ thá»ƒ tháº¥t báº¡i vÃ¬:
              </p>
              <p className="text-sm text-neutral-400">
                â€¢ TÃ i khoáº£n MoMo khÃ´ng Ä‘á»§ sá»‘ dÆ°
              </p>
              <p className="text-sm text-neutral-400">
                â€¢ Giao dá»‹ch bá»‹ há»§y bá»Ÿi ngÆ°á»i dÃ¹ng
              </p>
              <p className="text-sm text-neutral-400">â€¢ Lá»—i káº¿t ná»‘i máº¡ng</p>
            </div>

            <div className="flex flex-col items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => router.push("/subscription")}
                className="w-full rounded-full bg-orange-500 hover:bg-orange-400 text-black font-semibold py-3 px-6 transition-colors"
              >
                Thá»­ láº¡i
              </button>
              <p className="text-xs text-neutral-500">
                Tá»± Ä‘á»™ng chuyá»ƒn hÆ°á»›ng sau {countdown} giÃ¢y...
              </p>
            </div>
          </div>
        )}
      </div>

      <PortalFooter />
    </main>
  );
}
