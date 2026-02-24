"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import type { OrderResponse } from "@/types/order";
import { getOrderById } from "@/services/order.service";
import type { ProfileData } from "@/types/profile";
import {
  ArrowRight,
  ArrowLeft,
  Clock3,
  Coffee,
  Gift,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Truck,
  MapPin,
  TicketPercent,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, canUseImage, FALLBACK_IMG } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import type { Promotion } from "@/types/promotion";
import { useAppContext } from "@/app/AppProvider";
import { toast } from "sonner";
import { createOrder } from "@/services/order.service";
import type { CreateOrderRequest } from "@/types/order";
import Link from "next/link";

type DeliveryMethod = "delivery" | "pickup";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const STEP_ITEMS = [
  { title: "Giỏ hàng", caption: "Kiểm tra sản phẩm" },
  { title: "Thanh toán", caption: "Địa chỉ & phương thức" },
  { title: "Hoàn tất", caption: "Xác nhận & nhận hóa đơn" },
];

const CheckoutContent = () => {
  const router = useRouter();
  const { items, updateQuantity, removeItem, totalPrice, clearCart } =
    useCart();
  const { accessToken } = useAppContext();

  const [currentStep, setCurrentStep] = useState(0);
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("delivery");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "momo">("cash");
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<Promotion | null>(null);
  const [note, setNote] = useState("");
  const [address, setAddress] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [successOrder, setSuccessOrder] = useState<OrderResponse | null>(null);

  useEffect(() => {
    if (accessToken) {
      const fetchProfile = async () => {
        setIsLoadingProfile(true);
        try {
          const profile = await fetch("/api/profile", {
            cache: "no-store",
            credentials: "same-origin",
          }).then(async (res) => {
            const payload = await res.json().catch(() => null);
            if (!res.ok) {
              throw new Error(
                payload?.message || `Load profile failed (${res.status})`,
              );
            }
            return payload as ProfileData;
          });
          if (profile.address) {
            setAddress(profile.address);
          }
        } catch (error) {
          console.error("Failed to load profile", error);
        } finally {
          setIsLoadingProfile(false);
        }
      };
      fetchProfile();
    }
  }, [accessToken]);

  const searchParams = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<
    "success" | "failed" | null
  >(null);

  useEffect(() => {
    const resultCode = searchParams.get("resultCode");
    const orderId = searchParams.get("orderId");
    const message = searchParams.get("message");

    if (resultCode !== null) {
      if (resultCode === "0") {
        setPaymentStatus("success");
        setCurrentStep(2);
        if (orderId && accessToken) {
          getOrderById(accessToken, Number(orderId))
            .then((order) => {
              setSuccessOrder(order);
              setCreatedOrderId(order.orderId);
            })
            .catch((err) =>
              console.error("Failed to fetch momo order details", err),
            );
        }

        toast.success("Thanh toán MoMo thành công!");
        clearCart();
      } else {
        setPaymentStatus("failed");
        toast.error(`Thanh toán thất bại: ${message}`);
      }
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams, clearCart]);

  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);

  const handleUpdateAddress = async () => {
    if (!accessToken) return;
    if (!address.trim()) {
      toast.error("Vui lòng nhập địa chỉ");
      return;
    }

    try {
      setIsUpdatingAddress(true);
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
        credentials: "same-origin",
      }).then(async (res) => {
        const payload = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(
            payload?.message || `Update profile failed (${res.status})`,
          );
        }
        return payload;
      });
      toast.success("Đã cập nhật địa chỉ thành công!");
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật địa chỉ thất bại");
    } finally {
      setIsUpdatingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      toast.error("Giỏ hàng đang trống");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const payload: CreateOrderRequest = {
        orderType: "ONLINE",
        orderItems: items.map((item) => ({
          productVariantId: item.variantId,
          quantity: item.quantity,
          toppingItems: item.toppings.map((t) => ({
            toppingId: t.id,
            quantity: t.quantity,
          })),
        })),
        promotionCode: appliedVoucher?.promotionCode,
        paymentGateway: paymentMethod.toUpperCase(),
        returnUrl: window.location.href,
      };

      if (!accessToken) {
        toast.error("Vui lòng đăng nhập để đặt hàng");
        return;
      }

      const res = await createOrder(accessToken, payload);

      setCreatedOrderId(res.orderId);
      setSuccessOrder(res); // Save for success step

      if (paymentMethod === "momo" && res.payUrl) {
        window.location.href = res.payUrl;
        return; // Stop execution to wait for redirect
      }

      toast.success("Đặt hàng thành công!");
      clearCart();

      // If just cash or no payUrl, just show success
      setCurrentStep(2);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Checkout Error:", error);
      toast.error(error instanceof Error ? error.message : "Đặt hàng thất bại");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [tempSelectedVoucher, setTempSelectedVoucher] =
    useState<Promotion | null>(null);
  const [isPromoDialogOpen, setIsPromoDialogOpen] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const freeShipThreshold = 150_000;

  useEffect(() => {
    const controller = new AbortController();

    const fetchPromotions = async () => {
      try {
        setPromoLoading(true);
        setPromoError(null);

        const res = await fetch("/api/promotion", {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });

        const text = await res.text();
        const payload: unknown = text ? JSON.parse(text) : null;

        if (!res.ok) {
          throw new Error("Failed to fetch promotions");
        }

        if (!Array.isArray(payload)) {
          throw new Error("Invalid promotions format");
        }

        setPromotions(payload as Promotion[]);
      } catch (e: unknown) {
        const isAbortError =
          e instanceof DOMException && e.name === "AbortError";
        if (isAbortError) return;

        setPromoError(e instanceof Error ? e.message : String(e));
        setPromotions([]);
      } finally {
        setPromoLoading(false);
      }
    };

    fetchPromotions();
    return () => controller.abort();
  }, []);

  const totals = useMemo(() => {
    const subtotal = totalPrice;
    const shipping = deliveryMethod === "delivery" ? 15000 : 0;

    let voucherDiscount = 0;
    if (appliedVoucher) {
      if (appliedVoucher.discountType === "PERCENTAGE") {
        voucherDiscount = Math.min(
          (subtotal * (appliedVoucher.discountValue || 0)) / 100,
          40000,
        );
      } else if (appliedVoucher.discountType === "FIXED_AMOUNT") {
        voucherDiscount = appliedVoucher.discountValue || 0;
      }
    }

    const total = Math.max(subtotal + shipping - voucherDiscount, 0);

    return { subtotal, shipping, voucherDiscount, total };
  }, [totalPrice, deliveryMethod, appliedVoucher]);

  const handleApplyVoucher = () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) {
      setAppliedVoucher(null);
      return;
    }

    const promo = promotions.find(
      (p) => p.promotionCode.toUpperCase() === code && p.status === "ACTIVE",
    );

    if (promo) {
      setAppliedVoucher(promo);
    } else {
      setAppliedVoucher(null);
      alert("Mã khuyến mãi không hợp lệ hoặc đã hết hạn");
    }
  };

  const remainingForFreeShip = Math.max(freeShipThreshold - totals.subtotal, 0);
  const isEmpty = items.length === 0;

  return (
    <div className="min-h-screen bg-white pt-10">
      <div className="container mx-auto px-4 lg:px-8 py-10 space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (currentStep > 0) {
                    setCurrentStep((prev) => prev - 1);
                  } else {
                    router.back();
                  }
                }}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </Button>
            </div>
            <p className="text-sm font-medium text-amber-800">
              Đơn hàng hôm nay
            </p>
            <h1 className="text-3xl font-semibold text-stone-900 mt-1">
              Thanh toán
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {currentStep === 0
                ? "Kiểm tra món, chọn ưu đãi, ghi chú nhanh trước khi thanh toán."
                : currentStep === 1
                  ? "Chọn hình thức thanh toán và hoàn tất đơn hàng."
                  : "Đơn hàng đã được ghi nhận thành công!"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {STEP_ITEMS.map((step, idx) => {
              const isActive = idx === currentStep;
              const isCompleted = idx < currentStep;
              return (
                <div key={step.title} className="flex items-center gap-3">
                  <div
                    className={cn(
                      "rounded-full px-3 py-2 border shadow-sm transition-all duration-300",
                      isActive
                        ? "border-amber-200 bg-amber-50 text-amber-800 ring-2 ring-amber-100"
                        : isCompleted
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-gray-200 bg-white text-gray-400",
                    )}
                  >
                    <p className="text-xs font-semibold leading-tight">
                      Bước {idx + 1}
                    </p>
                    <p className="text-xs font-bold">{step.title}</p>
                  </div>
                  {idx < STEP_ITEMS.length - 1 && (
                    <div
                      className={cn(
                        "h-px w-6",
                        isCompleted ? "bg-green-300" : "bg-gray-200",
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </header>

        <div
          className={cn(
            "grid gap-6 transition-all duration-500",
            currentStep === 2
              ? "grid-cols-1 max-w-2xl mx-auto"
              : "grid-cols-1 lg:grid-cols-3",
          )}
        >
          <div className="lg:col-span-2 space-y-5">
            {currentStep === 0 ? (
              <>
                <Card className="border-amber-100 bg-white/80 shadow-sm transition-all">
                  <CardHeader className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">
                          Phương thức nhận hàng
                        </CardTitle>
                        <CardDescription>
                          Chọn cách nhận phù hợp nhất cho đơn của bạn.
                        </CardDescription>
                      </div>
                      <div className="hidden md:flex items-center gap-2 text-xs text-amber-800 font-semibold">
                        <ShieldCheck className="w-4 h-4" />
                        Đảm bảo nhiệt độ & niêm phong
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod("delivery")}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                          deliveryMethod === "delivery"
                            ? "border-amber-300 bg-amber-50/60 shadow-sm"
                            : "border-gray-200 hover:border-amber-200 hover:bg-amber-50/40",
                        )}
                      >
                        <span className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-800">
                          <Truck className="w-4 h-4" />
                        </span>
                        <div>
                          <p className="font-semibold text-stone-900">
                            Giao tận nơi
                          </p>
                          <p className="text-sm text-gray-600">
                            Phí ship linh hoạt, giao nhanh 25-35 phút.
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryMethod("pickup")}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                          deliveryMethod === "pickup"
                            ? "border-amber-300 bg-amber-50/60 shadow-sm"
                            : "border-gray-200 hover:border-amber-200 hover:bg-amber-50/40",
                        )}
                      >
                        <span className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-800">
                          <Coffee className="w-4 h-4" />
                        </span>
                        <div>
                          <p className="font-semibold text-stone-900">
                            Nhận tại cửa hàng
                          </p>
                          <p className="text-sm text-gray-600">
                            Giữ nhiệt 2h, miễn phí. Chọn quầy gần bạn nhất.
                          </p>
                        </div>
                      </button>
                    </div>

                    {deliveryMethod === "delivery" && (
                      <div className="space-y-2 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-sm font-semibold text-stone-900">
                          Địa chỉ giao hàng
                        </label>
                        <Textarea
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder={
                            isLoadingProfile
                              ? "Đang tải địa chỉ..."
                              : "Số nhà, tên đường, phường/xã, quận/huyện..."
                          }
                          className="bg-white border-amber-100 focus-visible:ring-amber-200 min-h-[80px]"
                        />
                        <div className="flex justify-end pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleUpdateAddress}
                            // Stop propagation to prevent form defaults if inside form
                            type="button"
                            disabled={isUpdatingAddress || isLoadingProfile}
                            className="text-xs border-amber-200 hover:bg-amber-50 text-amber-800 h-8"
                          >
                            {isUpdatingAddress
                              ? "Đang lưu..."
                              : "Xác nhận địa chỉ"}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 italic">
                          * Phí giao hàng sẽ được tính toán dựa trên khoảng
                          cách.
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm border border-amber-100">
                        <Clock3 className="w-4 h-4 text-amber-700" />
                        Dự kiến: 25-35 phút
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm border border-amber-100">
                        <MapPin className="w-4 h-4 text-amber-700" />
                        42 Nguyễn Huệ, Quận 1, TP.HCM
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-amber-100 bg-white/90 shadow-md">
                  <CardHeader className="flex flex-col gap-1">
                    <CardTitle className="text-xl">Danh sách món</CardTitle>
                    <CardDescription>
                      {items.length} sản phẩm · Kiểm tra lại giỏ hàng của bạn.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEmpty ? (
                      <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/40 p-6 text-center">
                        <p className="text-lg font-semibold text-stone-900">
                          Giỏ hàng đang trống
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Hãy chọn cho mình một món đồ uống thật ngon nhé!
                        </p>
                        <div className="mt-4 flex justify-center gap-3">
                          <Button asChild variant="outline">
                            <Link href="/menu">Khám phá đồ uống</Link>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      items.map((item) => {
                        const sizeDelta = item.size === "M" ? -4000 : 0;
                        const toppingTotal = item.toppings.reduce(
                          (sum, t) => sum + t.price * t.quantity,
                          0,
                        );
                        const itemPrice =
                          (item.basePrice + sizeDelta + toppingTotal) *
                          item.quantity;

                        return (
                          <div
                            key={item.id}
                            className="group relative flex flex-col gap-3 rounded-xl border border-amber-100 bg-white/80 p-4 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
                          >
                            <button
                              onClick={() => removeItem(item.id)}
                              className="absolute right-3 top-3 rounded-full p-2 text-gray-400 transition hover:bg-amber-50 hover:text-amber-800"
                              aria-label={`Xóa ${item.productName}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            <div className="flex gap-4">
                              <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-amber-50">
                                <Image
                                  src={canUseImage(item.productImage) ? (item.productImage as string) : FALLBACK_IMG}
                                  alt={item.productName}
                                  fill
                                  sizes="80px"
                                  className="object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = FALLBACK_IMG;
                                  }}
                                />
                              </div>

                              <div className="flex-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-base font-semibold text-stone-900">
                                    {item.productName}
                                  </p>
                                </div>

                                <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-amber-800">
                                  <span className="rounded-full bg-amber-50 px-2 py-0.5">
                                    Size {item.size}
                                  </span>
                                  {item.iceLevel && (
                                    <span className="rounded-full bg-amber-50 px-2 py-0.5">
                                      Đá {item.iceLevel}
                                    </span>
                                  )}
                                </div>

                                {item.toppings.length > 0 && (
                                  <div className="text-xs text-gray-600">
                                    Topping:{" "}
                                    {item.toppings
                                      .map((t) => `${t.name} x${t.quantity}`)
                                      .join(", ")}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    updateQuantity(item.id, item.quantity - 1)
                                  }
                                  disabled={item.quantity <= 1}
                                  className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 text-amber-800 transition hover:bg-amber-50 disabled:opacity-50"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="min-w-[24px] text-center text-sm font-semibold text-stone-900">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateQuantity(item.id, item.quantity + 1)
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 bg-[#693916] text-white transition hover:bg-amber-900"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="text-right">
                                <p className="text-base font-semibold text-amber-800">
                                  {formatCurrency(itemPrice)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>

                <Card className="border-amber-100 bg-white/80 shadow-sm">
                  <CardHeader className="flex flex-col gap-2">
                    <CardTitle className="text-lg">Ghi chú đơn hàng</CardTitle>
                    <CardDescription>
                      Hãy để barista biết nếu bạn có yêu cầu gì đặc biệt nhé.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Ví dụ: Ít đường, đừng bỏ ống hút nhựa..."
                      className="min-h-[100px]"
                    />
                  </CardContent>
                </Card>
              </>
            ) : currentStep === 1 ? (
              // Step 2: Payment Selection
              <Card className="border-amber-200 bg-white shadow-md transition-all">
                <CardHeader>
                  <CardTitle className="text-xl">
                    Hình thức thanh toán
                  </CardTitle>
                  <CardDescription>
                    Chọn phương thức thanh toán an toàn và tiện lợi nhất.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("momo")}
                      className={cn(
                        "flex items-center gap-4 rounded-xl border p-5 text-left transition-all",
                        paymentMethod === "momo"
                          ? "border-pink-300 bg-pink-50 ring-2 ring-pink-100 shadow-sm"
                          : "border-gray-100 hover:border-pink-200 hover:bg-pink-50/30",
                      )}
                    >
                      <div className="h-12 w-12 rounded-lg bg-pink-600 flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden">
                        <Image
                          src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png"
                          alt="MoMo"
                          width={48}
                          height={48}
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-stone-900 text-lg">
                          Ví MoMo
                        </p>
                        <p className="text-sm text-gray-600">
                          Thanh toán nhanh chóng, an toàn qua ứng dụng MoMo.
                        </p>
                      </div>
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
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
                        "flex items-center gap-4 rounded-xl border p-5 text-left transition-all",
                        paymentMethod === "cash"
                          ? "border-amber-300 bg-amber-50 ring-2 ring-amber-100 shadow-sm"
                          : "border-gray-100 hover:border-amber-200 hover:bg-amber-50/30",
                      )}
                    >
                      <div className="h-12 w-12 rounded-lg bg-amber-800 flex items-center justify-center text-white shrink-0 shadow-sm">
                        <MapPin className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-stone-900 text-lg">
                          Tiền mặt
                        </p>
                        <p className="text-sm text-gray-600">
                          Thanh toán trực tiếp khi nhận hàng hoặc tại quầy.
                        </p>
                      </div>
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                          paymentMethod === "cash"
                            ? "border-amber-800 bg-amber-800"
                            : "border-gray-300",
                        )}
                      >
                        {paymentMethod === "cash" && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </button>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4 border border-gray-100 mt-6">
                    <p className="text-sm text-gray-600 italic">
                      Lưu ý: Bạn có thể đổi hình thức thanh toán bất cứ lúc nào
                      trước khi xác nhận đơn hàng.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Step 3: Order Success
              // Step 3: Order Success
              <div className="flex flex-col items-center justify-center py-12 animate-in fade-in zoom-in duration-500 max-w-lg mx-auto">
                <div className="mb-6 relative">
                  <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-25"></div>
                  <div className="relative h-20 w-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 shadow-sm">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                </div>

                <div className="text-center space-y-3 mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Đặt hàng thành công!
                  </h2>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                    Đơn hàng{" "}
                    <span className="font-semibold text-gray-900">
                      #{createdOrderId}
                    </span>{" "}
                    đã được ghi nhận. <br />
                    Chúng tôi sẽ sớm liên hệ để xác nhận.
                  </p>
                </div>

                <Card className="w-full border-gray-100 bg-gray-50/50 mb-8 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Mã đơn hàng
                    </span>
                    <span className="font-mono text-sm font-bold text-gray-900">
                      #{createdOrderId}
                    </span>
                  </div>
                  <div className="p-4 bg-white">
                    <div className="flex justify-between items-center mb-3 text-sm">
                      <span className="text-gray-600">
                        Phương thức thanh toán
                      </span>
                      <span className="font-medium text-gray-900 flex items-center gap-2">
                        {paymentMethod === "momo" ? (
                          <>
                            <Image
                              src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png"
                              alt="MoMo"
                              width={16}
                              height={16}
                              className="object-contain" // Fixed class
                            />
                            Ví MoMo
                          </>
                        ) : (
                          <>
                            <MapPin className="w-4 h-4 text-amber-700" />
                            Tiền mặt
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Tổng thanh toán</span>
                      <span className="font-bold text-lg text-amber-700">
                        {successOrder
                          ? formatCurrency(successOrder.paidPrice)
                          : formatCurrency(totals.total)}
                      </span>
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 text-center border-t border-green-100">
                    <p className="text-xs font-medium text-green-700 flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Đơn hàng đã được xác nhận thanh toán
                    </p>
                  </div>
                </Card>

                <div className="grid grid-cols-2 gap-3 w-full">
                  <Button
                    onClick={() => router.push("/menu")}
                    variant="outline"
                    className="h-11 border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  >
                    Về trang chủ
                  </Button>
                  <Button
                    onClick={() => router.push("/profile?tab=orders")}
                    className="h-11 bg-amber-700 hover:bg-amber-800 text-white shadow-md shadow-amber-900/10"
                  >
                    Xem đơn hàng
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div
            className={cn(
              "space-y-4 lg:sticky lg:top-28 transition-all duration-300",
              currentStep === 2 ? "hidden" : "lg:col-span-1 block",
            )}
          >
            <Card className="border-amber-200 bg-white shadow-lg">
              <CardHeader className="pb-4 border-b border-gray-50">
                <CardTitle className="flex items-center justify-between text-xl">
                  Tóm tắt đơn
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800">
                    {items.length} món
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2 rounded-lg border border-amber-100 bg-amber-50/40 p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                    <Gift className="w-4 h-4" />
                    Mã khuyến mãi
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      placeholder="Nhập mã ưu đãi"
                      className="bg-white border-amber-100 focus-visible:ring-amber-200"
                      disabled={currentStep > 0}
                    />
                    <Button
                      onClick={handleApplyVoucher}
                      className="bg-[#693916] hover:bg-amber-900 text-white"
                      disabled={promoLoading || currentStep > 0}
                    >
                      Dùng
                    </Button>
                  </div>

                  <Dialog
                    open={isPromoDialogOpen}
                    onOpenChange={setIsPromoDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-amber-600 hover:text-amber-800 text-xs font-medium flex items-center gap-1"
                        disabled={currentStep > 0}
                        onClick={() => {
                          setTempSelectedVoucher(appliedVoucher); // Init with current
                        }}
                      >
                        <TicketPercent className="w-3 h-3" />
                        Chọn mã khuyến mãi khác
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
                      <DialogHeader>
                        <DialogTitle>Mã khuyến mãi của bạn</DialogTitle>
                        <DialogDescription>
                          Chọn mã ưu đãi để áp dụng vào đơn hàng
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-2 scrollbar-thin">
                        {promoLoading ? (
                          <div className="text-center py-4 text-gray-500">
                            Đang tải mã...
                          </div>
                        ) : promotions.length === 0 ? (
                          <div className="text-center py-8 text-gray-500 flex flex-col items-center">
                            <TicketPercent className="w-10 h-10 text-gray-300 mb-2" />
                            <p>Chưa có mã khuyến mãi nào</p>
                          </div>
                        ) : (
                          promotions
                            .filter(
                              (p) =>
                                p.status === "ACTIVE" ||
                                p.promotionStatus === "ACTIVE",
                            )
                            .map((promo) => (
                              <div
                                key={promo.promotionId}
                                className={cn(
                                  "border rounded-lg p-3 flex gap-3 cursor-pointer transition-all hover:bg-amber-50 active:scale-[0.98]",
                                  tempSelectedVoucher?.promotionId ===
                                    promo.promotionId
                                    ? "border-amber-500 bg-amber-50 ring-1 ring-amber-500"
                                    : "border-gray-200",
                                )}
                                onClick={() => setTempSelectedVoucher(promo)}
                              >
                                <div className="h-12 w-12 bg-amber-100 text-amber-700 rounded-md flex items-center justify-center shrink-0 font-bold text-xs uppercase text-center p-1">
                                  {promo.discountType === "PERCENTAGE"
                                    ? `${promo.discountValue}%`
                                    : `${promo.discountValue / 1000}k`}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                    <p className="font-semibold text-stone-900 truncate">
                                      {promo.promotionCode}
                                    </p>
                                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                      {promo.promotionType}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600 line-clamp-1">
                                    {promo.promotionName}
                                  </p>
                                  <p className="text-[10px] text-gray-400 mt-1">
                                    HSD:{" "}
                                    {new Date(promo.endDate).toLocaleDateString(
                                      "vi-VN",
                                    )}
                                  </p>
                                </div>
                                {tempSelectedVoucher?.promotionId ===
                                  promo.promotionId && (
                                    <div className="self-center">
                                      <CheckCircle2 className="w-5 h-5 text-amber-600" />
                                    </div>
                                  )}
                              </div>
                            ))
                        )}
                      </div>
                      <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsPromoDialogOpen(false)}
                        >
                          Hủy
                        </Button>
                        <Button
                          className="bg-[#693916] hover:bg-amber-900 text-white"
                          onClick={() => {
                            setAppliedVoucher(tempSelectedVoucher);
                            if (tempSelectedVoucher) {
                              setVoucherCode(tempSelectedVoucher.promotionCode);
                            } else {
                              setVoucherCode("");
                            }
                            setIsPromoDialogOpen(false);
                          }}
                        >
                          Áp dụng
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {appliedVoucher ? (
                    <p className="text-xs text-green-700 font-medium">
                      ✓ Đã áp dụng mã{" "}
                      <strong>{appliedVoucher.promotionCode}</strong>
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">
                      Thêm mã để được giảm giá hời nhé.
                    </p>
                  )}
                </div>

                <div className="space-y-3 py-2 border-b border-gray-50 text-sm">
                  <Row
                    label="Tạm tính"
                    value={formatCurrency(totals.subtotal)}
                  />
                  <Row
                    label={
                      deliveryMethod === "delivery"
                        ? "Phí giao"
                        : "Nhận tại quầy"
                    }
                    value={
                      deliveryMethod === "delivery"
                        ? formatCurrency(totals.shipping)
                        : "Miễn phí"
                    }
                    highlight={deliveryMethod === "pickup"}
                  />
                  <Row
                    label="Giảm giá"
                    value={
                      appliedVoucher
                        ? `- ${formatCurrency(totals.voucherDiscount)}`
                        : "-"
                    }
                    highlight={Boolean(appliedVoucher)}
                  />
                </div>

                <div className="rounded-xl p-4 shadow-md">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm opacity-80 font-medium">
                      Tổng thanh toán
                    </p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(totals.total)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <Button
                    className="w-full h-12 text-base font-bold bg-[#693916] hover:bg-amber-900 shadow-warm"
                    disabled={isEmpty}
                    onClick={() => {
                      if (currentStep === 0) {
                        setCurrentStep(1);
                        window.scrollTo(0, 0);
                      } else {
                        handlePlaceOrder();
                      }
                    }}
                  >
                    {isPlacingOrder
                      ? "Đang xử lý..."
                      : currentStep === 0
                        ? "Tiếp tục thanh toán"
                        : "Xác nhận đặt hàng"}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>

                  {currentStep === 0 && (
                    <Button
                      variant="outline"
                      className="w-full h-11 text-base border-amber-200 text-[#693916] hover:bg-amber-50"
                      onClick={() => router.push("/menu")}
                    >
                      Đặt thêm món
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {remainingForFreeShip > 0 && currentStep === 0 && (
              <div className="rounded-lg bg-blue-50 p-4 border border-blue-100 flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                  !
                </div>
                <p className="text-xs text-blue-700 leading-relaxed font-medium">
                  Mua thêm{" "}
                  <span className="font-bold">
                    {formatCurrency(remainingForFreeShip)}
                  </span>{" "}
                  nữa thôi để nhận được ưu đãi{" "}
                  <span className="font-bold underline">
                    MIỄN PHÍ VẬN CHUYỂN
                  </span>{" "}
                  bạn nhé!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function Row({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-700">{label}</span>
      <span
        className={cn(
          "font-semibold",
          highlight ? "text-amber-800" : "text-stone-900",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Đang tải...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
