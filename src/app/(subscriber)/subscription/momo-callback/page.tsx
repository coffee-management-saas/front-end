"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { PortalFooter } from "@/components/portal/PortalFooter";

type PaymentStatus = "loading" | "success" | "failed";

export default function MomoCallbackPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<PaymentStatus>("loading");
    const [orderId, setOrderId] = useState<string>("");
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const resultCode = searchParams.get("resultCode");
        const orderIdParam = searchParams.get("orderId") ?? "";
        setOrderId(orderIdParam);

        // resultCode = "0" nghĩa là thành công
        if (resultCode === "0") {
            setStatus("success");
        } else {
            setStatus("failed");
        }
    }, [searchParams]);

    // Đếm ngược và tự redirect về trang chủ
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
                        <p className="text-neutral-400 text-sm">Đang xử lý kết quả thanh toán...</p>
                    </div>
                ) : status === "success" ? (
                    <div className="flex flex-col items-center text-center max-w-md gap-6">
                        {/* Icon thành công */}
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
                                Thanh toán thành công!
                            </h1>
                            <p className="text-neutral-300">
                                Gói đăng ký của bạn đã được kích hoạt. Cảm ơn bạn đã tin tưởng sử dụng dịch vụ.
                            </p>
                            {orderId && (
                                <p className="text-xs text-neutral-500 font-mono mt-2">
                                    Mã giao dịch: {orderId}
                                </p>
                            )}
                        </div>

                        <div className="w-full rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-4 space-y-1">
                            <p className="text-sm text-emerald-300 font-medium">✓ Tài khoản đã được tạo</p>
                            <p className="text-sm text-emerald-300 font-medium">✓ Gói dịch vụ đã được kích hoạt</p>
                            <p className="text-sm text-emerald-300 font-medium">✓ Email xác nhận đã được gửi</p>
                        </div>

                        <div className="flex flex-col items-center gap-3 w-full">
                            <button
                                type="button"
                                onClick={() => router.push("/subscription")}
                                className="w-full rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-3 px-6 transition-colors"
                            >
                                Quay về trang gói dịch vụ
                            </button>
                            <p className="text-xs text-neutral-500">
                                Tự động chuyển hướng sau {countdown} giây...
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center max-w-md gap-6">
                        {/* Icon thất bại */}
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
                                Thanh toán thất bại
                            </h1>
                            <p className="text-neutral-300">
                                Giao dịch không thể hoàn thành. Vui lòng kiểm tra lại thông tin thanh toán và thử lại.
                            </p>
                            {orderId && (
                                <p className="text-xs text-neutral-500 font-mono mt-2">
                                    Mã giao dịch: {orderId}
                                </p>
                            )}
                        </div>

                        <div className="w-full rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-4 space-y-1">
                            <p className="text-sm text-red-300/90">Giao dịch có thể thất bại vì:</p>
                            <p className="text-sm text-neutral-400">• Tài khoản MoMo không đủ số dư</p>
                            <p className="text-sm text-neutral-400">• Giao dịch bị hủy bởi người dùng</p>
                            <p className="text-sm text-neutral-400">• Lỗi kết nối mạng</p>
                        </div>

                        <div className="flex flex-col items-center gap-3 w-full">
                            <button
                                type="button"
                                onClick={() => router.push("/subscription")}
                                className="w-full rounded-full bg-orange-500 hover:bg-orange-400 text-black font-semibold py-3 px-6 transition-colors"
                            >
                                Thử lại
                            </button>
                            <p className="text-xs text-neutral-500">
                                Tự động chuyển hướng sau {countdown} giây...
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <PortalFooter />
        </main>
    );
}