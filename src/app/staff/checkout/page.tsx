"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Minus,
  Plus,
  QrCode,
  Receipt,
  ShoppingCart,
  TicketPercent,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, canUseImage, FALLBACK_IMG } from "@/lib/utils";
import { createEmployeeOrder, initiateEmployeePayment } from "@/services/order.service";
import { useAppContext } from "@/app/AppProvider";
import type { CreateOrderRequest } from "@/types/order";
import type { Promotion } from "@/types/promotion";

type LevelOption = "Ít" | "Bình thường" | "Nhiều";
type PaymentMethod = "cash" | "momo";

type SelectedTopping = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type CartItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  quantity: number;
  variantId: number;
  size: string;
  ice: LevelOption;
  toppings: SelectedTopping[];
};

type StaffCheckoutPayload = {
  cart: CartItem[];
  orderType: "dine-in" | "take-away" | "delivery";
  paymentMethod?: PaymentMethod;
  note: string;
  customerName: string;
  customerPhone: string;
  voucherCode: string;
  appliedVoucher: Promotion | null;
  createdAt: number;
};

const formatVnd = (val: number) =>
  val.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

function safeImageSrc(src: unknown): string {
  if (typeof src !== "string") return FALLBACK_IMG;
  const trimmed = src.trim();
  if (!trimmed) return FALLBACK_IMG;
  if (canUseImage(trimmed) || trimmed.startsWith("/")) return trimmed;
  if (!trimmed.includes("://")) return `/${trimmed.replace(/^\/+/, "")}`;
  return FALLBACK_IMG;
}

function isPromotionActive(p: Promotion): boolean {
  const status = p.status ?? p.promotionStatus;
  return status === "ACTIVE";
}

export default function StaffCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tokens } = useAppContext();
  const momoHandledRef = useRef(false);

  const [step, setStep] = useState<0 | 1 | 2>(1);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [hydrateError, setHydrateError] = useState<string | null>(null);
  const [isSuccessDetailOpen, setIsSuccessDetailOpen] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<
    "dine-in" | "take-away" | "delivery"
  >("dine-in");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [note, setNote] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<Promotion | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  useEffect(() => {
    const resultCode = searchParams.get("resultCode");
    if (resultCode === null) return;
    if (momoHandledRef.current) return;
    momoHandledRef.current = true;

    const message = searchParams.get("message") || "";
    const orderIdParam = searchParams.get("orderId");

    if (resultCode === "0") {
      let realOrderId = orderIdParam;
      if (realOrderId && realOrderId.includes("_")) {
        const parts = realOrderId.split("_");
        if (parts.length > 1) realOrderId = parts[1];
      }

      const parsed = realOrderId ? Number(realOrderId) : NaN;
      if (Number.isFinite(parsed)) setCreatedOrderId(parsed);

      toast.success("Thanh toán MoMo thành công!");
      setStep(2);
      sessionStorage.removeItem("staff-pos-checkout");
    } else {
      toast.error(`Thanh toán thất bại: ${message || resultCode}`);
      setStep(1);
    }

    try {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    } catch {}
  }, [searchParams]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("staff-pos-checkout");
      if (!raw) {
        if (
          searchParams.get("resultCode") !== null ||
          step === 2 ||
          createdOrderId !== null
        ) {
          setHydrateError(null);
          setIsHydrated(true);
          return;
        }
        setHydrateError(
          "Không có dữ liệu thanh toán. Vui lòng quay lại POS để chọn món.",
        );
        setIsHydrated(true);
        return;
      }
      const payload = JSON.parse(raw) as StaffCheckoutPayload;
      if (!payload?.cart?.length) {
        if (
          searchParams.get("resultCode") !== null ||
          step === 2 ||
          createdOrderId !== null
        ) {
          setHydrateError(null);
          setIsHydrated(true);
          return;
        }
        setHydrateError(
          "Không có món trong đơn. Vui lòng quay lại POS để chọn món.",
        );
        setIsHydrated(true);
        return;
      }

      setCart(payload.cart);
      setOrderType(payload.orderType ?? "dine-in");
      setPaymentMethod(payload.paymentMethod ?? "cash");
      setNote(payload.note ?? "");
      setCustomerName(payload.customerName ?? "");
      setCustomerPhone(payload.customerPhone ?? "");
      setVoucherCode(payload.voucherCode ?? "");
      setAppliedVoucher(payload.appliedVoucher ?? null);
      setHydrateError(null);
      setIsHydrated(true);
    } catch {
      setHydrateError(
        "Dữ liệu thanh toán bị lỗi. Vui lòng quay lại POS và thử lại.",
      );
      setIsHydrated(true);
    }
  }, [router, searchParams, step, createdOrderId]);

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      try {
        const res = await fetch("/api/promotion", {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });
        const text = await res.text();
        const payload: unknown = text ? JSON.parse(text) : null;
        if (!res.ok || !Array.isArray(payload)) return;
        setPromotions(payload as Promotion[]);
      } catch (e) {
        const isAbortError =
          e instanceof DOMException && e.name === "AbortError";
        if (!isAbortError) setPromotions([]);
      }
    };
    run();
    return () => controller.abort();
  }, []);

  const subTotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [cart],
  );
  const vat = useMemo(() => Math.round(subTotal * 0.08), [subTotal]);

  const voucherDiscount = useMemo(() => {
    if (!appliedVoucher) return 0;
    const minSpent = Number(appliedVoucher.minimumSpent ?? 0);
    if (Number.isFinite(minSpent) && minSpent > 0 && subTotal < minSpent)
      return 0;

    let discount = 0;
    if (appliedVoucher.promotionType === "ORDER") {
      if (appliedVoucher.discountType === "PERCENTAGE") {
        const dv = Number(appliedVoucher.discountValue || 0);
        const rate = dv > 1 ? dv / 100 : dv; // supports both "2" and "0.02" as 2%
        const raw = subTotal * rate;
        const capCandidate = Number(appliedVoucher.maxDiscountAmount ?? NaN);
        const cap =
          Number.isFinite(capCandidate) && capCandidate >= 1000
            ? capCandidate
            : 40000;
        discount = Math.min(raw, cap);
      } else if (appliedVoucher.discountType === "FIXED_AMOUNT") {
        discount = appliedVoucher.discountValue || 0;
      }
    } else if (appliedVoucher.promotionType === "PRODUCT") {
      // Product-level vouchers depend on eligible products; backend will compute final discount.
      discount = 0;
    }

    return Math.max(0, Math.min(discount, subTotal + vat));
  }, [appliedVoucher, subTotal, vat]);

  const total = useMemo(
    () => Math.max(subTotal + vat - voucherDiscount, 0),
    [subTotal, vat, voucherDiscount],
  );

  useEffect(() => {
    if (!isHydrated || hydrateError) return;
    try {
      const raw = sessionStorage.getItem("staff-pos-checkout");
      const prev = raw
        ? (JSON.parse(raw) as Partial<StaffCheckoutPayload>)
        : {};
      const next: StaffCheckoutPayload = {
        cart,
        orderType,
        paymentMethod,
        note,
        customerName,
        customerPhone,
        voucherCode,
        appliedVoucher,
        createdAt: Number(prev.createdAt ?? Date.now()),
      };
      sessionStorage.setItem("staff-pos-checkout", JSON.stringify(next));
    } catch {
      // ignore
    }
  }, [
    appliedVoucher,
    cart,
    customerName,
    customerPhone,
    hydrateError,
    isHydrated,
    note,
    orderType,
    paymentMethod,
    voucherCode,
  ]);

  const updateQuantity = (idx: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item, i) =>
          i === idx
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((i) => i.quantity > 0),
    );
  };

  const removeItem = (idx: number) =>
    setCart((prev) => prev.filter((_, i) => i !== idx));

  const handleApplyVoucher = () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) {
      setAppliedVoucher(null);
      return;
    }
    const promo = promotions.find(
      (p) => p.promotionCode?.toUpperCase() === code && isPromotionActive(p),
    );
    if (!promo) {
      setAppliedVoucher(null);
      toast.error("Mã voucher không hợp lệ hoặc đã hết hạn.");
      return;
    }
    const minSpent = Number(promo.minimumSpent ?? 0);
    if (Number.isFinite(minSpent) && minSpent > 0 && subTotal < minSpent) {
      setAppliedVoucher(null);
      toast.error(`Đơn tối thiểu ${formatVnd(minSpent)} để dùng voucher này.`);
      return;
    }
    setAppliedVoucher(promo);
    toast.success(`Đã áp dụng voucher ${promo.promotionCode}`);
    if (promo.promotionType === "PRODUCT") {
      toast.message(
        "Voucher theo sản phẩm: giảm giá sẽ được tính khi tạo đơn.",
      );
    }
  };

  const placeOrder = async () => {
    if (placingOrder) return;
    if (!tokens.accessToken) {
      toast.error("Vui lòng đăng nhập để tạo đơn");
      return;
    }
    if (cart.length === 0) {
      toast.error("Chưa có món trong đơn");
      setStep(0);
      return;
    }

    setPlacingOrder(true);
    try {
      const returnUrl = typeof window !== "undefined" ? window.location.href : "";
      const payload: CreateOrderRequest = {
        orderType: "OFFLINE",
        promotionCode: appliedVoucher?.promotionCode,
        orderItems: cart.map((item) => ({
          productVariantId: item.variantId,
          quantity: item.quantity,
          toppingItems: item.toppings
            .filter((t) => t.quantity > 0)
            .map((t) => ({ toppingId: Number(t.id), quantity: t.quantity }))
            .filter((t) => Number.isFinite(t.toppingId) && t.toppingId > 0),
        })),
        paymentGateway: paymentMethod === "momo" ? "MOMO" : "CASH",
        ...(returnUrl ? { returnUrl } : {}),
      };

      const res = await createEmployeeOrder(tokens.accessToken, payload);

      if (paymentMethod === "momo") {
        const fromCreate = res.payUrl;
        const fromInitiate =
          !fromCreate && returnUrl
            ? (
                await initiateEmployeePayment(
                  tokens.accessToken,
                  res.orderId,
                  returnUrl,
                )
              ).payUrl
            : null;

        const payUrl = fromCreate || fromInitiate;
        if (payUrl) {
          window.location.href = payUrl;
          return;
        }

        throw new Error("Không lấy được link thanh toán MoMo");
      }
      setCreatedOrderId(res.orderId);
      setStep(2);
      toast.success("Thanh toán thành công!");
      try {
        window.scrollTo(0, 0);
      } catch {}
      sessionStorage.removeItem("staff-pos-checkout");
    } catch (e) {
      console.error(e);
      if (e instanceof ApiError) {
        const payloadMsg =
          e.payload && typeof e.payload === "object" && "message" in e.payload
            ? String((e.payload as { message?: unknown }).message ?? "")
            : "";
        toast.error(payloadMsg || `${e.message} (${e.status})`);
      } else {
        toast.error(e instanceof Error ? e.message : "Tạo đơn thất bại");
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-white pt-8">
        <div className="container mx-auto px-4 lg:px-8 py-6 space-y-4">
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-stone-900">
                Đang tải...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Đang chuẩn bị dữ liệu thanh toán.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (hydrateError) {
    return (
      <div className="min-h-screen bg-white pt-8">
        <div className="container mx-auto px-4 lg:px-8 py-6 space-y-4">
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-stone-900">
                Không thể mở thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">{hydrateError}</p>
              <Button
                type="button"
                className="bg-[#693916] hover:bg-[#876F60] text-white"
                onClick={() => router.push("/staff/menu")}
              >
                Quay lại POS
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-8">
      <div className="container mx-auto px-4 lg:px-8 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => {
              if (step === 0) {
                router.push("/staff/menu");
                return;
              }
              setStep((s) => (s > 0 ? ((s - 1) as 0 | 1 | 2) : 0));
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Button>
          <div className="text-xs text-gray-500">Bước {step + 1} / 3</div>
        </div>

        <header>
          <p className="text-sm font-medium text-amber-800">POS - Thanh toán</p>
          <h1 className="text-2xl font-semibold text-stone-900 mt-1">
            {step === 0 ? "Giỏ hàng" : step === 1 ? "Thanh toán" : "Hoàn tất"}
          </h1>
        </header>

        {step === 2 ? (
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#693916]">
                <CheckCircle2 className="w-5 h-5" />
                Thành công
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-700">
                Đã tạo đơn{" "}
                <span className="font-semibold text-stone-900">
                  #{createdOrderId ?? "-"}
                </span>
                .
              </p>
              <div className="rounded-xl border border-gray-100 bg-white p-3 text-sm text-gray-700 space-y-1">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-600">Phương thức</span>
                  <span className="font-semibold text-stone-900">
                    {paymentMethod === "momo" ? "MoMo" : "Tiền mặt"}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-600">Khách</span>
                  <span className="font-semibold text-stone-900">
                    {customerName.trim() ? customerName.trim() : "Khách lẻ"}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-600">SĐT</span>
                  <span className="font-semibold text-stone-900">
                    {customerPhone.trim() ? customerPhone.trim() : "-"}
                  </span>
                </div>
                <div className="h-px bg-gray-100 my-1" />
                <div className="flex justify-between gap-3 text-[#693916]">
                  <span className="font-semibold">Tổng thanh toán</span>
                  <span className="font-bold">{formatVnd(total)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  className="bg-[#693916] hover:bg-[#876F60] text-white"
                  onClick={() => router.push("/staff/menu")}
                >
                  Tạo đơn mới
                </Button>
                <Dialog
                  open={isSuccessDetailOpen}
                  onOpenChange={setIsSuccessDetailOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" type="button">
                      Xem chi tiết
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Chi tiết thanh toán</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-lg border border-gray-100 bg-white p-2">
                          <p className="text-[11px] text-gray-500">Khách</p>
                          <p className="font-semibold text-stone-900">
                            {customerName.trim() ? customerName.trim() : "Khách lẻ"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-gray-100 bg-white p-2">
                          <p className="text-[11px] text-gray-500">SĐT</p>
                          <p className="font-semibold text-stone-900">
                            {customerPhone.trim() ? customerPhone.trim() : "-"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {cart.map((item, idx) => (
                          <div
                            key={`${item.id}-${item.variantId}-${idx}`}
                            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3"
                          >
                            <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-gray-50">
                              <Image
                                src={safeImageSrc(item.image)}
                                alt={item.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-stone-900 line-clamp-1">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-gray-600 line-clamp-1">
                                Size {item.size} • Đá {item.ice}
                                {item.toppings.length > 0 ? " • " : ""}
                                {item.toppings.length > 0
                                  ? `Topping: ${item.toppings
                                      .map((t) => `${t.name} x${t.quantity}`)
                                      .join(", ")}`
                                  : ""}
                              </p>
                              <p className="text-[11px] text-gray-500">
                                {formatVnd(item.price)} x {item.quantity}
                              </p>
                            </div>
                            <div className="text-sm font-bold text-[#693916]">
                              {formatVnd(item.price * item.quantity)}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-xl border border-gray-100 bg-white p-3 space-y-1 text-sm">
                        <div className="flex justify-between text-gray-700">
                          <span>Tạm tính</span>
                          <span className="font-semibold text-stone-900">
                            {formatVnd(subTotal)}
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                          <span>VAT 8%</span>
                          <span className="font-semibold text-stone-900">
                            {formatVnd(vat)}
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                          <span>Voucher</span>
                          <span className="font-semibold text-[#693916]">
                            -{formatVnd(voucherDiscount)}
                          </span>
                        </div>
                        <div className="h-px bg-gray-100 my-1" />
                        <div className="flex justify-between font-bold text-[#693916]">
                          <span>Tổng thanh toán</span>
                          <span>{formatVnd(total)}</span>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.push("/staff/order")}
                >
                  Xem đơn
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 space-y-3">
              <Card className="border border-gray-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-[#693916]" />
                    Món đã chọn
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cart.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Chưa có món. Quay lại để chọn món.
                    </p>
                  ) : (
                    cart.map((item, idx) => (
                      <div
                        key={`${item.id}-${item.variantId}-${idx}`}
                        className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-gray-50">
                            <Image
                              src={safeImageSrc(item.image)}
                              alt={item.name}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-stone-900 line-clamp-1">
                              {item.name}
                            </p>
                            <p className="text-[11px] text-gray-600 line-clamp-1">
                              Size {item.size} • Đá {item.ice}
                            </p>
                            <p className="text-sm font-semibold text-[#693916]">
                              {formatVnd(item.price)}
                            </p>
                            {item.toppings.length > 0 && (
                              <p className="text-[11px] text-gray-500 line-clamp-1">
                                Topping:{" "}
                                {item.toppings
                                  .map((t) => `${t.name} x${t.quantity}`)
                                  .join(", ")}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateQuantity(idx, -1)}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-6 text-center text-sm font-semibold text-stone-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(idx, 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#693916] text-white hover:bg-[#876F60]"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-700 hover:bg-red-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {step === 1 && (
                <Card className="border border-gray-100 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-[#693916]" />
                      Ghi chú & thông tin khách (tuỳ chọn)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Input
                      placeholder="Tên khách (tuỳ chọn)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="bg-white"
                    />
                    <Input
                      placeholder="SĐT (tuỳ chọn)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="bg-white"
                    />
                    <Textarea
                      placeholder="Ghi chú cho barista (ít đá, không ống hút...)"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="bg-white"
                    />
                    <div className="flex items-center bg-white rounded-full shadow-sm border border-gray-200 px-1 py-1">
                      {(["dine-in", "take-away", "delivery"] as const).map(
                        (t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setOrderType(t)}
                            className={`px-4 py-2 text-xs font-semibold rounded-full transition-all ${orderType === t ? "bg-[#cec3bc] text-[#693916] shadow-sm" : "text-gray-600 hover:bg-gray-50 hover:text-[#876F60]"}`}
                          >
                            {t === "dine-in"
                              ? "Tại chỗ"
                              : t === "take-away"
                                ? "Mang đi"
                                : "Giao tận nơi"}
                          </button>
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="lg:col-span-5 space-y-3">
              {step === 1 && (
                <Card className="border border-gray-100 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                      <TicketPercent className="w-4 h-4 text-[#693916]" />
                      Voucher
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Nhập mã voucher"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                        className="bg-white h-9"
                      />
                      <Button
                        type="button"
                        onClick={handleApplyVoucher}
                        className="h-9 rounded-full bg-[#693916] hover:bg-[#876F60] text-white px-4 text-xs"
                      >
                        Áp dụng
                      </Button>
                    </div>
                    {appliedVoucher ? (
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-[#693916] font-semibold">
                          Đã áp dụng: {appliedVoucher.promotionCode}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedVoucher(null);
                            setVoucherCode("");
                          }}
                          className="text-[11px] font-semibold text-gray-600 hover:text-[#693916]"
                        >
                          Bỏ
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-500">
                        Nhập mã để giảm giá.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="border border-gray-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-stone-900">
                    Tổng tiền
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Tạm tính</span>
                    <span className="font-semibold text-stone-900">
                      {formatVnd(subTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>VAT 8%</span>
                    <span className="font-semibold text-stone-900">
                      {formatVnd(vat)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>
                      Voucher
                      {appliedVoucher?.promotionCode ? (
                        <span className="text-[11px] text-gray-500">
                          {" "}
                          ({appliedVoucher.promotionCode})
                          {appliedVoucher.promotionType === "PRODUCT"
                            ? " (tính khi tạo đơn)"
                            : ""}
                        </span>
                      ) : null}
                    </span>
                    <span className="font-semibold text-[#693916]">
                      -{formatVnd(voucherDiscount)}
                    </span>
                  </div>
                  <div className="h-px bg-gray-100 my-1" />
                  <div className="flex justify-between text-base font-bold text-[#693916]">
                    <span>Tổng thanh toán</span>
                    <span>{formatVnd(total)}</span>
                  </div>
                </CardContent>
              </Card>

              {step === 1 && (
                <Card className="border border-gray-100 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-stone-900">
                      Thanh toán
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setPaymentMethod("cash")}
                      className={`h-10 text-xs gap-1.5 ${paymentMethod === "cash" ? "bg-[#cec3bc] text-[#693916] border-[#cec3bc]" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}
                    >
                      <Receipt className="w-3.5 h-3.5" /> Tiền mặt
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setPaymentMethod("momo")}
                      className={`h-10 text-xs gap-1.5 ${paymentMethod === "momo" ? "bg-[#cec3bc] text-[#693916] border-[#cec3bc]" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}
                    >
                      <QrCode className="w-3.5 h-3.5" /> MoMo
                    </Button>
                  </CardContent>
                </Card>
              )}

              {step === 0 ? (
                <Button
                  className="w-full h-11 bg-[#693916] hover:bg-[#876F60] text-white disabled:opacity-60"
                  type="button"
                  disabled={cart.length === 0}
                  onClick={() => setStep(1)}
                >
                  Tiếp tục thanh toán
                </Button>
              ) : (
                <Button
                  className="w-full h-11 bg-[#693916] hover:bg-[#876F60] text-white disabled:opacity-60"
                  type="button"
                  disabled={cart.length === 0 || placingOrder}
                  onClick={placeOrder}
                >
                  {placingOrder
                    ? "Đang xử lý..."
                    : paymentMethod === "momo"
                      ? "Thanh toán MoMo"
                      : "Thanh toán tiền mặt"}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
