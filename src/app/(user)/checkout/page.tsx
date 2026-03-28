"use client";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  QrCode,
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
import {
  createOrder,
  initiatePayment,
  confirmCashPayment,
} from "@/services/order.service";
import type { CreateOrderRequest } from "@/types/order";
import Link from "next/link";

type DeliveryMethod = "delivery" | "pickup";
type PaymentMethod = "cash" | "momo" | "qr";
type AuthRole = "SHOP" | "EMPLOYEE" | "SYSTEM" | "USER";
const CHECKOUT_PAYMENT_METHOD_STORAGE_KEY = "checkout:selected-payment-method";

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return value === "cash" || value === "momo" || value === "qr";
}

function readStoredPaymentMethod(): PaymentMethod | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = sessionStorage.getItem(CHECKOUT_PAYMENT_METHOD_STORAGE_KEY);
    return isPaymentMethod(stored) ? stored : null;
  } catch {
    return null;
  }
}

function persistPaymentMethod(method: PaymentMethod) {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(CHECKOUT_PAYMENT_METHOD_STORAGE_KEY, method);
  } catch {
    // Ignore storage failures during redirect checkout.
  }
}

function clearPersistedPaymentMethod() {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(CHECKOUT_PAYMENT_METHOD_STORAGE_KEY);
  } catch {
    // Ignore storage failures during redirect checkout.
  }
}

function mapGatewayToPaymentMethod(gateway?: string | null): PaymentMethod {
  const normalized = gateway?.trim().toLowerCase();
  if (normalized === "momo") return "momo";
  if (normalized === "qr") return "qr";
  return "cash";
}

function getRoleFromAccessToken(token: string): AuthRole | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );

    const payload = JSON.parse(atob(padded)) as {
      role?: unknown;
      roles?: unknown;
      authorities?: unknown;
    };

    const rawRole =
      payload?.role ??
      (Array.isArray(payload?.roles) ? payload.roles[0] : null) ??
      (Array.isArray(payload?.authorities) ? payload.authorities[0] : null);

    if (!rawRole) return null;

    const normalized = String(rawRole).toUpperCase();
    const role = normalized.startsWith("ROLE_")
      ? normalized.slice(5)
      : normalized;

    if (
      role === "SHOP" ||
      role === "EMPLOYEE" ||
      role === "SYSTEM" ||
      role === "USER"
    ) {
      return role;
    }

    return null;
  } catch {
    return null;
  }
}

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
  const searchParams = useSearchParams();
  const role = useMemo(
    () => (accessToken ? getRoleFromAccessToken(accessToken) : null),
    [accessToken],
  );
  const isStaffRole =
    role === "EMPLOYEE" || role === "SHOP" || role === "SYSTEM";
  const backHomePath = role === "EMPLOYEE" ? "/staff/menu" : "/";

  const [currentStep, setCurrentStep] = useState(0);
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("delivery");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<Promotion | null>(null);
  const [note, setNote] = useState("");
  const [address, setAddress] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [successOrder, setSuccessOrder] = useState<OrderResponse | null>(null);
  const [capturedItems, setCapturedItems] = useState<
    Record<number, { name: string; size: string }>
  >({});

  const [paymentStatus, setPaymentStatus] = useState<
    "success" | "failed" | null
  >(null);

  // --- Google Maps state ---
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const addressInputRef = useRef<HTMLTextAreaElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const googleMapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  // Load Google Maps script once
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || typeof window === "undefined") return;
    if (document.getElementById("google-maps-script")) return;

    const script = document.createElement("script");
    script.id = "google-maps-script";
    // Dùng bản stable 'weekly' và tiếng Việt
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=vi&v=weekly`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      console.error("Lỗi: Không thể tải bản đồ Google Maps từ trang thanh toán.");
    };

    document.head.appendChild(script);
  }, []);

  // Initialize Autocomplete when delivery mode is selected
  const initAutocomplete = useCallback(() => {
    if (!addressInputRef.current) return;
    if (typeof window === "undefined" || !window.google?.maps?.places) return;
    if (autocompleteRef.current) return; // Already initialized

    const ac = new window.google.maps.places.Autocomplete(
      addressInputRef.current as unknown as HTMLInputElement,
      {
        componentRestrictions: { country: "vn" },
        fields: ["formatted_address", "geometry", "name"],
      }
    );

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (!place.geometry?.location) return;

      const newLat = place.geometry.location.lat();
      const newLng = place.geometry.location.lng();
      const formattedAddress = place.formatted_address || place.name || "";

      setLat(newLat);
      setLng(newLng);
      setAddress(formattedAddress);

      // Update map view
      if (googleMapInstanceRef.current) {
        googleMapInstanceRef.current.setCenter({ lat: newLat, lng: newLng });
        googleMapInstanceRef.current.setZoom(16);
        if (markerRef.current) {
          markerRef.current.setPosition({ lat: newLat, lng: newLng });
        } else {
          markerRef.current = new window.google.maps.Marker({
            position: { lat: newLat, lng: newLng },
            map: googleMapInstanceRef.current,
            animation: window.google.maps.Animation.DROP,
          });
        }
      }
    });

    autocompleteRef.current = ac;
  }, []);

  // init map & autocomplete when mapRef is available
  const initMap = useCallback((node: HTMLDivElement | null) => {
    mapRef.current = node;
    if (!node) return;

    const tryInit = () => {
      if (!window.google?.maps) {
        setTimeout(tryInit, 300);
        return;
      }

      if (!googleMapInstanceRef.current) {
        googleMapInstanceRef.current = new window.google.maps.Map(node, {
          center: { lat: 10.7725, lng: 106.6981 },
          zoom: 13,
          disableDefaultUI: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
      }

      initAutocomplete();
    };

    tryInit();
  }, [initAutocomplete]);

  // When textarea ref changes, wire autocomplete
  const addressTextareaRef = useCallback((node: HTMLTextAreaElement | null) => {
    addressInputRef.current = node;
    if (node && window.google?.maps?.places) {
      initAutocomplete();
    }
  }, [initAutocomplete]);

  useEffect(() => {
    // Check session storage for recently placed order items (useful for MoMo redirect)
    const stored = sessionStorage.getItem("last_placed_items");
    if (stored) {
      try {
        setCapturedItems(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored items", e);
      }
    }
  }, []);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (accessToken && !isStaffRole) {
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
  }, [accessToken, isStaffRole]);

  useEffect(() => {
    const resultCode = searchParams.get("resultCode");
    const orderIdParam = searchParams.get("orderId");
    const message = searchParams.get("message");
    const storedPaymentMethod = readStoredPaymentMethod();

    if (resultCode !== null && accessToken) {
      if (storedPaymentMethod) {
        setPaymentMethod(storedPaymentMethod);
      }

      if (resultCode === "0") {
        setPaymentStatus("success");
        setCurrentStep(2);

        if (orderIdParam) {
          // Extra handling for Momo orderId format: ORD_19_timestamp
          let realOrderId = orderIdParam;
          if (orderIdParam.includes("_")) {
            const parts = orderIdParam.split("_");
            if (parts.length > 1) realOrderId = parts[1];
          }

          // Add a small delay to ensure backend transaction is committed
          setTimeout(() => {
            getOrderById(accessToken, Number(realOrderId))
              .then((order) => {
                setSuccessOrder(order);
                setCreatedOrderId(order.orderId);
                setPaymentMethod(
                  storedPaymentMethod ??
                  mapGatewayToPaymentMethod(order.paymentGateway),
                );
                setShowSuccessModal(true);
                clearPersistedPaymentMethod();

                // Only clear URL after successful processing
                const newUrl = window.location.pathname;
                window.history.replaceState({}, "", newUrl);
              })
              .catch((err) => {
                console.error("Failed to fetch momo order details", err);
                toast.error("Không thể tải thông tin đơn hàng.");
              });
          }, 600);
        }

        toast.success("Thanh toán MoMo thành công!");
        clearCart();
        if (!orderIdParam) {
          clearPersistedPaymentMethod();
        }
      } else {
        setPaymentStatus("failed");
        toast.error(`Thanh toán thất bại: ${message}`);

        // Clear URL for failure too
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, [searchParams, clearCart, accessToken]);

  useEffect(() => {
    const mode = searchParams.get("mode");
    const orderIdParam = searchParams.get("orderId");

    if (mode === "chatbot" && orderIdParam && accessToken) {
      getOrderById(accessToken, Number(orderIdParam))
        .then((order) => {
          setSuccessOrder(order);
          setCreatedOrderId(order.orderId);

          // Map items from fetched order to capturedItems for display consistency
          const namesMap: Record<number, { name: string; size: string }> = {};
          order.orderItems?.forEach((i) => {
            if (i.productVariantId) {
              namesMap[i.productVariantId] = {
                name: i.productName || "Sản phẩm",
                size: i.sizeName || "-",
              };
            }
          });
          setCapturedItems(namesMap);

          // Chatbot orders are already created as PENDING, go to payment selection
          setCurrentStep(1);
          clearCart();
        })
        .catch((err) => {
          console.error("Failed to fetch chatbot order", err);
          toast.error("Không thể tải đơn hàng từ AI.");
        });
    }
  }, [searchParams, accessToken, clearCart]);

  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  const shouldUseRedirectPayment =
    paymentMethod === "momo" || paymentMethod === "qr";
  const successPaymentMethod =
    paymentMethod !== "cash"
      ? paymentMethod
      : mapGatewayToPaymentMethod(successOrder?.paymentGateway);

  const handleUpdateAddress = async () => {
    if (!accessToken) return;
    if (isStaffRole) return;
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
    // If we're coming from chatbot, the order is already in DB
    const isChatbotFlow =
      searchParams.get("mode") === "chatbot" && createdOrderId;

    if (!isChatbotFlow && items.length === 0) {
      toast.error("Giỏ hàng đang trống");
      return;
    }

    setIsPlacingOrder(true);
    try {
      if (!accessToken) {
        router.push("/login");
        return;
      }

      let res: OrderResponse;

      if (isChatbotFlow && createdOrderId) {
        // Reuse existing order — choose payment method
        if (shouldUseRedirectPayment) {
          res = await initiatePayment(
            accessToken,
            createdOrderId,
            window.location.origin + window.location.pathname,
          );
        } else {
          // CASH: gọi API confirm-cash để backend xử lý thanh toán thực sự
          res = await confirmCashPayment(accessToken, createdOrderId);
        }
      } else {
        // Create new order
        const payload: CreateOrderRequest = {
          orderType: deliveryMethod === "delivery" ? "DELIVERY" : "ONLINE",
          orderItems: items.map((item) => ({
            productVariantId: item.variantId,
            quantity: item.quantity,
            toppingItems: item.toppings.map((t) => ({
              toppingId: t.id,
              quantity: t.quantity,
            })),
          })),
          promotionCode: appliedVoucher?.promotionCode,
          paymentGateway: shouldUseRedirectPayment ? "MOMO" : "CASH",
          returnUrl: window.location.href,
          ...(deliveryMethod === "delivery" && {
            deliveryAddress: address,
            latitude: lat ?? undefined,
            longitude: lng ?? undefined,
          }),
        };
        res = await createOrder(accessToken, payload);
      }

      if (shouldUseRedirectPayment && res.payUrl) {
        persistPaymentMethod(paymentMethod);
        window.location.href = res.payUrl;
        return;
      }

      if (shouldUseRedirectPayment) {
        throw new Error(
          paymentMethod === "qr"
            ? "Không lấy được mã QR thanh toán"
            : "Không lấy được link thanh toán MoMo",
        );
      }

      // Finalize success state
      setCreatedOrderId(res.orderId);
      setSuccessOrder(res);
      toast.success("Đặt hàng thành công!");
      clearCart();
      setCurrentStep(2);
      window.scrollTo(0, 0);
      setShowSuccessModal(true);
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
    // If we have a fetched order from chatbot/momo redirect, use its values
    if (
      successOrder &&
      (searchParams.get("mode") === "chatbot" || searchParams.get("resultCode"))
    ) {
      const subtotal = successOrder.basePrice || 0;
      const shippingFee = typeof successOrder.shippingFee === "number" ? successOrder.shippingFee : 0;
      const discountAmount = successOrder.discountAmount || 0;
      const total = successOrder.paidPrice || 0;
      return {
        subtotal,
        shipping: shippingFee,
        voucherDiscount: discountAmount,
        total,
      };
    }

    const subtotal = totalPrice;
    const shipping = deliveryMethod === "delivery" && subtotal > 0 ? 15000 : 0;

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
  }, [totalPrice, deliveryMethod, appliedVoucher, successOrder, searchParams]);

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
  const isEmpty = items.length === 0 && !successOrder;

  return (
    <div className="min-h-screen bg-white ">
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
                        <textarea
                          ref={addressTextareaRef}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder={
                            isLoadingProfile
                              ? "Đang tải địa chỉ..."
                              : "Nhập địa chỉ để tìm kiếm tự động..."
                          }
                          className="flex w-full rounded-md border border-amber-100 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 min-h-[80px] resize-none"
                          rows={3}
                        />
                        {/* Google Map preview */}
                        <div
                          ref={initMap}
                          className="w-full h-52 rounded-xl overflow-hidden border border-amber-100 mt-2 shadow-sm"
                          style={{ minHeight: "200px" }}
                        />
                        {lat && lng && (
                          <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Đã xác định vị trí: {lat.toFixed(6)}, {lng.toFixed(6)}
                          </p>
                        )}
                        <div className="flex justify-end pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleUpdateAddress}
                            type="button"
                            disabled={isUpdatingAddress || isLoadingProfile}
                            className="text-xs border-amber-200 hover:bg-amber-50 text-amber-800 h-8"
                          >
                            {isUpdatingAddress
                              ? "Đang lưu..."
                              : "Lưu địa chỉ"}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 italic">
                          * Phí giao hàng được tính tự động theo khoảng cách từ{" "}
                          cửa hàng đến địa chỉ của bạn.
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
                      {successOrder
                        ? successOrder.orderItems?.length || 0
                        : items.length}{" "}
                      sản phẩm · Kiểm tra lại đơn hàng của bạn.
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
                      (successOrder?.orderItems || items).map(
                        (item: any, idx) => {
                          const isFetchedItem = !!successOrder;

                          // Local cart item properties
                          const localItem = !isFetchedItem
                            ? (item as any)
                            : null;
                          // Fetched order item properties
                          const fetchedItem = isFetchedItem
                            ? (item as any)
                            : null;

                          const name =
                            fetchedItem?.productName ||
                            localItem?.productName ||
                            capturedItems[
                              fetchedItem?.productVariantId ||
                              localItem?.variantId
                            ]?.name ||
                            "Sản phẩm";
                          const size =
                            fetchedItem?.sizeName || localItem?.size || "-";

                          let displayPrice = 0;
                          if (isFetchedItem) {
                            displayPrice =
                              (fetchedItem.unitPrice || 0) *
                              (fetchedItem.quantity || 1);
                          } else {
                            const sizeDelta =
                              localItem.size === "M" ? -4000 : 0;
                            const toppingTotal = localItem.toppings.reduce(
                              (sum: number, t: any) =>
                                sum + t.price * t.quantity,
                              0,
                            );
                            displayPrice =
                              (localItem.basePrice + sizeDelta + toppingTotal) *
                              localItem.quantity;
                          }

                          const image =
                            localItem?.productImage ||
                            (fetchedItem?.productVariantId ? null : null); // We don't have images in fetched items easily

                          return (
                            <div
                              key={isFetchedItem ? idx : item.id}
                              className="group relative flex flex-col gap-3 rounded-xl border border-amber-100 bg-white/80 p-4 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
                            >
                              {!isFetchedItem && (
                                <button
                                  onClick={() => removeItem(item.id)}
                                  className="absolute right-3 top-3 rounded-full p-2 text-gray-400 transition hover:bg-amber-50 hover:text-amber-800"
                                  aria-label={`Xóa ${name}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}

                              <div className="flex gap-4">
                                <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-amber-50">
                                  <Image
                                    src={
                                      canUseImage(image)
                                        ? (image as string)
                                        : FALLBACK_IMG
                                    }
                                    alt={name}
                                    fill
                                    sizes="80px"
                                    className="object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        FALLBACK_IMG;
                                    }}
                                  />
                                </div>

                                <div className="flex-1 space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-base font-semibold text-stone-900">
                                      {name}
                                    </p>
                                  </div>

                                  <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-amber-800">
                                    <span className="rounded-full bg-amber-50 px-2 py-0.5">
                                      Size {size}
                                    </span>
                                    {!isFetchedItem && localItem.iceLevel && (
                                      <span className="rounded-full bg-amber-50 px-2 py-0.5">
                                        Đá {localItem.iceLevel}
                                      </span>
                                    )}
                                  </div>

                                  {(
                                    fetchedItem?.toppingPerOrderItems ||
                                    localItem?.toppings
                                  )?.length > 0 && (
                                      <div className="text-xs text-gray-600">
                                        Topping:{" "}
                                        {isFetchedItem
                                          ? fetchedItem.toppingPerOrderItems
                                            .map((t: any) => t.toppingName)
                                            .join(", ")
                                          : localItem.toppings
                                            .map(
                                              (t: any) =>
                                                `${t.name} x${t.quantity}`,
                                            )
                                            .join(", ")}
                                      </div>
                                    )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {!isFetchedItem ? (
                                    <>
                                      <button
                                        onClick={() =>
                                          updateQuantity(
                                            item.id,
                                            item.quantity - 1,
                                          )
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
                                          updateQuantity(
                                            item.id,
                                            item.quantity + 1,
                                          )
                                        }
                                        className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 bg-[#693916] text-white transition hover:bg-amber-900"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-sm font-semibold text-gray-600">
                                      Số lượng: {fetchedItem.quantity}
                                    </span>
                                  )}
                                </div>

                                <div className="text-right">
                                  <p className="text-base font-semibold text-amber-800">
                                    {formatCurrency(displayPrice)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        },
                      )
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
                          src="/images/momo.jpg"
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

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("qr")}
                      className={cn(
                        "flex items-center gap-4 rounded-xl border p-5 text-left transition-all",
                        paymentMethod === "qr"
                          ? "border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100 shadow-sm"
                          : "border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30",
                      )}
                    >
                      <div className="h-12 w-12 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                        <QrCode className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-stone-900 text-lg">
                          Mã QR
                        </p>
                        <p className="text-sm text-gray-600">
                          Trang thanh toán sẽ hiển thị mã QR để bạn quét trên
                          thiết bị khác.
                        </p>
                      </div>
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                          paymentMethod === "qr"
                            ? "border-emerald-600 bg-emerald-600"
                            : "border-gray-300",
                        )}
                      >
                        {paymentMethod === "qr" && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </button>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4 border border-gray-100 mt-6">
                    {paymentMethod !== "cash" && (
                      <p className="mb-2 text-sm font-medium text-stone-700">
                        {paymentMethod === "qr"
                          ? "Sau khi xác nhận đơn, trang thanh toán sẽ hiển thị mã QR để bạn quét và hoàn tất."
                          : "Bạn sẽ được chuyển sang MoMo để hoàn tất thanh toán."}
                      </p>
                    )}
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
                  <div className="p-4 bg-white border-t border-gray-100">
                    <div className="flex justify-between items-center mb-3 text-sm">
                      <span className="text-gray-600">
                        Phương thức thanh toán
                      </span>
                      <span
                        className={cn(
                          "font-medium flex items-center gap-2",
                          successPaymentMethod === "momo"
                            ? "text-pink-600"
                            : successPaymentMethod === "qr"
                              ? "text-emerald-600"
                              : "text-amber-800",
                        )}
                      >
                        {successPaymentMethod === "momo" ? (
                          <>
                            <Image
                              src="/images/momo.jpg"
                              alt="MoMo"
                              width={16}
                              height={16}
                              className="object-contain"
                            />
                            Ví MoMo
                          </>
                        ) : successPaymentMethod === "qr" ? (
                          <>
                            <QrCode className="w-4 h-4 text-emerald-600" />
                            Mã QR
                          </>
                        ) : (
                          <>
                            <MapPin className="w-4 h-4 text-amber-700" />
                            Tiền mặt
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm mb-4">
                      <span className="text-gray-600">Tổng thanh toán</span>
                      <span className="font-bold text-lg text-amber-700">
                        {successOrder
                          ? formatCurrency(successOrder.paidPrice || 0)
                          : formatCurrency(totals.total)}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 pt-4 border-t border-gray-100/50">
                      Chi tiết món đã đặt
                    </p>
                    <div className="space-y-4">
                      {successOrder?.orderItems?.map((item, idx) => {
                        // Resilient Fallback Logic
                        const fallbackList = JSON.parse(
                          sessionStorage.getItem("last_order_items_fallback") ||
                          "[]",
                        );
                        const fallback = fallbackList[idx];

                        const displayName =
                          item.productName ||
                          (item.productVariantId
                            ? capturedItems[item.productVariantId]?.name
                            : null) ||
                          fallback?.name ||
                          "Sản phẩm";

                        const displaySize =
                          item.sizeName ||
                          (item.productVariantId
                            ? capturedItems[item.productVariantId]?.size
                            : null) ||
                          fallback?.size ||
                          "-";

                        return (
                          <div
                            key={idx}
                            className="flex justify-between items-start text-sm bg-gray-50/50 p-3 rounded-lg border border-gray-100/50"
                          >
                            <div className="flex-1">
                              <p className="font-bold text-gray-900 text-base">
                                {displayName}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold uppercase">
                                  Size {displaySize}
                                </span>
                                <span className="text-gray-500 font-medium">
                                  x{item.quantity || 1}
                                </span>
                              </div>
                              {item.toppingPerOrderItems &&
                                item.toppingPerOrderItems.length > 0 && (
                                  <p className="text-[11px] text-gray-500 mt-1.5 italic">
                                    + Topping:{" "}
                                    {item.toppingPerOrderItems
                                      .map((t) => t.toppingName)
                                      .join(", ")}
                                  </p>
                                )}
                            </div>
                            <div className="text-right ml-4">
                              <span className="font-bold text-gray-900">
                                {formatCurrency(
                                  (item.unitPrice || 0) * (item.quantity || 1),
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "p-3 text-center border-t",
                      successOrder?.orderStatus === "PAID"
                        ? "bg-green-50 border-green-100 text-green-700"
                        : "bg-amber-50 border-amber-100 text-amber-700",
                    )}
                  >
                    <p className="text-xs font-medium flex items-center justify-center gap-1">
                      {successOrder?.orderStatus === "PAID" ? (
                        <ShieldCheck className="w-3 h-3" />
                      ) : (
                        <Clock3 className="w-3 h-3" />
                      )}
                      {successOrder?.orderStatus === "PAID"
                        ? "Đơn hàng đã được xác nhận thanh toán"
                        : "Đơn hàng đang chờ xử lý thanh toán"}
                    </p>
                  </div>
                </Card>

                <div className="grid grid-cols-2 gap-3 w-full">
                  <Button
                    onClick={() => router.push("/menu")}
                    className="h-11 bg-[#7a4a2a] hover:bg-[#986d50] text-white shadow-md shadow-amber-900/10"
                  >
                    Tiếp tục mua hàng
                  </Button>
                  <Button
                    onClick={() => router.push(backHomePath)}
                    variant="outline"
                    className="h-11 border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  >
                    Quay về trang chủ
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
                    {successOrder
                      ? successOrder.orderItems?.length || 0
                      : items.length}{" "}
                    món
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

                {/* List items in sidebar for summary */}
                {(successOrder || items.length > 0) && (
                  <div className="py-2 space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin border-b border-gray-50">
                    {(successOrder?.orderItems || items).map(
                      (item: any, idx: number) => {
                        const name =
                          item.productName ||
                          capturedItems[item.productVariantId || item.variantId]
                            ?.name ||
                          "Sản phẩm";
                        const size = item.sizeName || item.size || "-";
                        const qty = item.quantity || 1;
                        const price =
                          (item.unitPrice || item.basePrice || 0) * qty;
                        return (
                          <div
                            key={idx}
                            className="flex justify-between text-xs"
                          >
                            <span className="text-gray-600 line-clamp-1 flex-1">
                              {name} (Size {size}) x{qty}
                            </span>
                            <span className="font-medium text-stone-900 ml-2">
                              {formatCurrency(price)}
                            </span>
                          </div>
                        );
                      },
                    )}
                  </div>
                )}

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
                      if (!accessToken) {
                        router.push("/login");
                        return;
                      }
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
