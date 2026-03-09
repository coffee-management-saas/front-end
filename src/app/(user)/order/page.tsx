"use client";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppContext } from "@/app/AppProvider";
import { useCart } from "@/contexts/CartContext";
import {
  getOrderById,
  confirmCashPayment,
  payWithMomo,
} from "@/services/order.service";
import type { OrderResponse } from "@/types/order";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  CheckCircle2,
  Coffee,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

function OrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken } = useAppContext();
  const { clearCart } = useCart();

  const orderId = searchParams.get("orderId");
  const resultCode = searchParams.get("resultCode");

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "momo">("cash");
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    let finalOrderId = orderId;

    // Handle MoMo orderId format (ORD_ID_TIMESTAMP)
    if (orderId && orderId.startsWith("ORD_")) {
      const parts = orderId.split("_");
      if (parts.length >= 2) {
        finalOrderId = parts[1];
      }
    }

    if (!finalOrderId || !accessToken) {
      setError(
        !finalOrderId ? "Không tìm thấy mã đơn hàng." : "Vui lòng đăng nhập.",
      );
      setLoading(false);
      return;
    }

    // Process MoMo callback result
    if (resultCode === "0") {
      toast.success("✅ Thanh toán MoMo thành công!");
      clearCart();
      setPaid(true);
      // Clean URL and redirect to checkout for success UI
      router.replace(`/checkout?resultCode=0&orderId=${orderId}`, {
        scroll: false,
      });
    } else if (resultCode && resultCode !== "0") {
      toast.error("Thanh toán MoMo thất bại hoặc đã bị hủy.");
      router.replace(`/checkout?resultCode=${resultCode}&orderId=${orderId}`, {
        scroll: false,
      });
    }

    getOrderById(accessToken, Number(finalOrderId))
      .then((data) => {
        setOrder(data);
        if (data.orderStatus === "PAID") {
          setPaid(true);
          // If already paid (maybe from IPN), ensure cart is cleared
          clearCart();
        }
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Lỗi tải đơn hàng."),
      )
      .finally(() => setLoading(false));
  }, [orderId, accessToken, resultCode, clearCart, router]);

  const handlePay = async () => {
    if (!order || !accessToken) return;
    setPaying(true);
    try {
      if (paymentMethod === "momo") {
        const result = await payWithMomo(accessToken, order.orderId);
        if (result.payUrl) {
          window.location.href = result.payUrl;
        } else {
          toast.error(
            "Không nhận được link thanh toán MoMo. Vui lòng thử lại.",
          );
        }
      } else {
        await confirmCashPayment(accessToken, order.orderId);
        setPaid(true);
        clearCart();
        toast.success("✅ Đã xác nhận đặt hàng thành công!");
        setTimeout(() => router.push("/profile?tab=orders"), 2000);
      }
    } catch (err: any) {
      toast.error(err?.message || "Thanh toán thất bại, vui lòng thử lại.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-700" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-red-500 font-medium">{error}</p>
        <Button variant="outline" onClick={() => router.push("/")}>
          Về trang chủ
        </Button>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-white pt-10">
      <div className="container mx-auto max-w-2xl px-4 py-10 space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Button>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-7 h-7 text-green-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {paid
                  ? `Đơn hàng #${order.orderId} đã được ghi nhận!`
                  : `Đơn hàng #${order.orderId} đã được tạo!`}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {paid
                  ? "Cảm ơn bạn đã đặt hàng. Đơn của bạn đang được xử lý."
                  : "Vui lòng chọn phương thức thanh toán để hoàn tất."}
              </p>
            </div>
          </div>
        </div>

        <Card className="border-amber-100">
          <CardHeader>
            <CardTitle className="text-base">Chi tiết đơn hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.orderItems?.map((item, idx) => (
              <div
                key={item.orderItemId ?? idx}
                className="flex justify-between items-start text-sm"
              >
                <div className="flex-1 mr-4">
                  <p className="font-medium text-gray-800">
                    {item.productName ?? `Sản phẩm #${item.orderItemId}`}
                    {item.sizeName && (
                      <span className="ml-1 text-xs text-amber-700 font-semibold uppercase bg-amber-50 px-1.5 py-0.5 rounded">
                        {item.sizeName}
                      </span>
                    )}
                    <span className="text-gray-400 font-normal ml-1">
                      x{item.quantity}
                    </span>
                  </p>
                  {item.toppingPerOrderItems &&
                    item.toppingPerOrderItems.length > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        +{" "}
                        {item.toppingPerOrderItems
                          .map((t) => t.toppingName)
                          .join(", ")}
                      </p>
                    )}
                </div>
                <span className="font-semibold text-amber-800 shrink-0">
                  {formatCurrency((item.unitPrice ?? 0) * (item.quantity ?? 1))}
                </span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-3 flex justify-between font-bold">
              <span>Tổng cộng</span>
              <span className="text-amber-700 text-lg">
                {formatCurrency(order.paidPrice ?? 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        {!paid && (
          <Card className="border-amber-200">
            <CardHeader>
              <CardTitle className="text-base">Hình thức thanh toán</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("momo")}
                className={cn(
                  "w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all",
                  paymentMethod === "momo"
                    ? "border-pink-300 bg-pink-50 ring-2 ring-pink-100"
                    : "border-gray-100 hover:border-pink-200 hover:bg-pink-50/30",
                )}
              >
                <div className="h-10 w-10 rounded-lg bg-pink-600 flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png"
                    alt="MoMo"
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Ví MoMo</p>
                  <p className="text-xs text-gray-500">
                    Thanh toán nhanh qua app MoMo
                  </p>
                </div>
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    paymentMethod === "momo"
                      ? "border-pink-600 bg-pink-600"
                      : "border-gray-300",
                  )}
                >
                  {paymentMethod === "momo" && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={cn(
                  "w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all",
                  paymentMethod === "cash"
                    ? "border-amber-300 bg-amber-50 ring-2 ring-amber-100"
                    : "border-gray-100 hover:border-amber-200 hover:bg-amber-50/30",
                )}
              >
                <div className="h-10 w-10 rounded-lg bg-amber-700 flex items-center justify-center shrink-0">
                  <Coffee className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Tiền mặt</p>
                  <p className="text-xs text-gray-500">
                    Thanh toán khi nhận hàng hoặc tại quầy
                  </p>
                </div>
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    paymentMethod === "cash"
                      ? "border-amber-700 bg-amber-700"
                      : "border-gray-300",
                  )}
                >
                  {paymentMethod === "cash" && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </button>

              <div className="bg-amber-50 rounded-lg p-3 flex items-start gap-2 border border-amber-100 mt-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800">
                  {paymentMethod === "momo"
                    ? "Bạn sẽ được chuyển sang trang MoMo để hoàn tất thanh toán."
                    : "Đơn hàng đã được ghi nhận. Nhân viên sẽ liên hệ xác nhận trong vòng 5-10 phút."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/menu")}
            className="h-11 border-gray-200 text-gray-700"
          >
            {paid ? "Tiếp tục mua" : "Huỷ bỏ"}
          </Button>
          {!paid && (
            <Button
              id="order-pay-btn"
              onClick={handlePay}
              disabled={paying}
              className="h-11 bg-[#693916] hover:bg-[#7a4420] text-white shadow"
            >
              {paying ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {paymentMethod === "momo"
                ? "Thanh toán MoMo"
                : "Xác nhận đơn hàng"}
            </Button>
          )}
          {paid && (
            <Button
              onClick={() => router.push("/profile?tab=orders")}
              className="h-11 bg-green-600 hover:bg-green-700 text-white"
            >
              Xem đơn hàng của tôi
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-700" />
        </div>
      }
    >
      <OrderContent />
    </Suspense>
  );
}
