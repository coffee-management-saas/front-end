"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ApiError, canUseImage, FALLBACK_IMG } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  TicketPercent,
  Timer,
  Users,
  Coffee,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductCategoriesResponse, ProductCategory } from "@/types/catagories";
import {
  getProductSizes,
  getProductVariants,
  getProducts,
} from "@/services/product.service";
import { useAppContext } from "@/app/AppProvider";
import type {
  Product,
  ProductVariant,
  ProductsMeta,
  Size,
} from "@/types/product";
import type { ToppingsResponse } from "@/types/topping";
import type { ScheduleDto, SchedulesResponse } from "@/types/schedules";
import type { Promotion } from "@/types/promotion";
import {
  createOrder,
  getOrderById,
  initiatePayment,
} from "@/services/order.service";
import type { CreateOrderRequest, OrderResponse } from "@/types/order";

type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  tags?: string[];
  isNew?: boolean;
};

type LevelOption = "Ít" | "Bình thường" | "Nhiều";
type PaymentMethod = "cash" | "momo";
type SelectedTopping = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type CartItem = MenuItem & {
  quantity: number;
  note?: string;
  variantId: number;
  size: string;
  ice: LevelOption;
  toppings: SelectedTopping[];
};

const MENU: MenuItem[] = [];
const MENU_PAGE_SIZE = 18;

function getCartItemKey(
  item: Pick<CartItem, "id" | "variantId" | "size" | "ice" | "toppings">,
) {
  const toppingKey = [...item.toppings]
    .map((t) => `${t.id}:${t.quantity}`)
    .sort()
    .join("-");
  return `${item.id}-${item.variantId}-${item.size}-${item.ice}-${toppingKey}`;
}

function isPromotionActive(p: Promotion): boolean {
  const status = p.status ?? p.promotionStatus;
  return status === "ACTIVE";
}

const formatVnd = (val: number) =>
  val.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

function safeImageSrc(src: unknown): string {
  if (typeof src !== "string") return FALLBACK_IMG;

  const trimmed = src.trim();
  if (!trimmed) return FALLBACK_IMG;

  if (canUseImage(trimmed) || trimmed.startsWith("/")) return trimmed;

  // Handle backend paths like "images/foo.jpg" (no leading slash)
  if (!trimmed.includes("://")) return `/${trimmed.replace(/^\/+/, "")}`;

  return FALLBACK_IMG;
}

function formatNowHHmm(date = new Date()): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function decodeJwtPayload(token?: string): Record<string, unknown> | null {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parseTimeToMinutes(value?: string | null): number | null {
  if (!value) return null;
  if (/\d{4}-\d{2}-\d{2}/.test(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return d.getHours() * 60 + d.getMinutes();
    }
  }
  const parts = value.split(":").map((p) => Number(p));
  if (parts.length < 2) return null;
  const [hh, mm] = parts;
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

function formatTimeHHmm(value?: string | null): string | null {
  if (!value) return null;
  const timeOnly = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (timeOnly) {
    const hh = String(Number(timeOnly[1])).padStart(2, "0");
    const mm = timeOnly[2];
    return `${hh}:${mm}`;
  }
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return formatNowHHmm(d);
  return null;
}

function formatTimeRangeLabel(
  startTime?: string | null,
  endTime?: string | null,
): string {
  const st = formatTimeHHmm(startTime);
  const en = formatTimeHHmm(endTime);
  if (st && en) return `${st} - ${en}`;
  if (startTime && endTime) return `${startTime} - ${endTime}`;
  return "-";
}

function normalizeDayOfWeekKey(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    // 0..6 (Sun..Sat) or 1..7 (Mon..Sun)
    const keys = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];
    if (value >= 0 && value <= 6) return keys[value] ?? null;
    if (value >= 1 && value <= 7) return keys[value % 7] ?? null;
    return null;
  }

  const raw = String(value).trim().toUpperCase();
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return normalizeDayOfWeekKey(Number(raw));

  const map: Record<string, string> = {
    SUN: "SUNDAY",
    MON: "MONDAY",
    TUE: "TUESDAY",
    WED: "WEDNESDAY",
    THU: "THURSDAY",
    FRI: "FRIDAY",
    SAT: "SATURDAY",
    CHU_NHAT: "SUNDAY",
    CN: "SUNDAY",
    T2: "MONDAY",
    THU_2: "MONDAY",
    THU_HAI: "MONDAY",
    T3: "TUESDAY",
    THU_3: "TUESDAY",
    THU_BA: "TUESDAY",
    T4: "WEDNESDAY",
    THU_4: "WEDNESDAY",
    THU_TU: "WEDNESDAY",
    T5: "THURSDAY",
    THU_5: "THURSDAY",
    THU_NAM: "THURSDAY",
    T6: "FRIDAY",
    THU_6: "FRIDAY",
    THU_SAU: "FRIDAY",
    T7: "SATURDAY",
    THU_7: "SATURDAY",
    THU_BAY: "SATURDAY",
  };

  if (raw in map) return map[raw] ?? null;
  if (
    raw === "SUNDAY" ||
    raw === "MONDAY" ||
    raw === "TUESDAY" ||
    raw === "WEDNESDAY" ||
    raw === "THURSDAY" ||
    raw === "FRIDAY" ||
    raw === "SATURDAY"
  ) {
    return raw;
  }

  return null;
}

function isMinutesInRange(
  nowMinutes: number,
  startMinutes: number,
  endMinutes: number,
) {
  if (endMinutes === startMinutes) return true;
  if (endMinutes > startMinutes) {
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }
  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
}

function getTodayDayOfWeekKey(date = new Date()): string {
  const keys = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ] as const;
  return keys[date.getDay()] ?? "";
}

function getYesterdayDayOfWeekKey(date = new Date()): string {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return getTodayDayOfWeekKey(d);
}

const StaffPosPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tokens } = useAppContext();
  const momoHandledRef = useRef(false);

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [menuMeta, setMenuMeta] = useState<ProductsMeta | null>(null);
  const [menuPage, setMenuPage] = useState(0);

  const [voucherCode, setVoucherCode] = useState("");
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [appliedVoucher, setAppliedVoucher] = useState<Promotion | null>(null);

  const categoryIdFromUrl = useMemo(() => {
    const v = searchParams.get("category");
    return v ? String(v) : null;
  }, [searchParams]);

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    categoryIdFromUrl,
  );
  const [search, setSearch] = useState("");
  const [orderType, setOrderType] = useState<
    "dine-in" | "take-away" | "delivery"
  >("dine-in");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCartKey, setSelectedCartKey] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [successOrder, setSuccessOrder] = useState<OrderResponse | null>(null);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isSessionRestored, setIsSessionRestored] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [customIce, setCustomIce] = useState<LevelOption>("Bình thường");
  const [customQty, setCustomQty] = useState(1);
  const [toppings, setToppings] = useState<SelectedTopping[]>([]);
  const [topLoading, setTopLoading] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantLoading, setVariantLoading] = useState(false);
  const [variantError, setVariantError] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    null,
  );
  const [schedules, setSchedules] = useState<ScheduleDto[]>([]);
  const [nowLabel, setNowLabel] = useState<string>(() => formatNowHHmm());
  const [shiftLabel, setShiftLabel] = useState<string>("-");
  const [employeeLabel, setEmployeeLabel] = useState<string>("-");

  useEffect(() => {
    setActiveCategoryId(categoryIdFromUrl);
    setMenuPage(0);
  }, [categoryIdFromUrl]);

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
      setIsSuccessOpen(true);
      setCreatedOrderId(Number.isFinite(parsed) ? parsed : null);
      if (Number.isFinite(parsed) && tokens.accessToken) {
        getOrderById(tokens.accessToken, parsed)
          .then((order) => setSuccessOrder(order))
          .catch(() => setSuccessOrder(null));
      } else {
        setSuccessOrder(null);
      }
      toast.success("Thanh toán MoMo thành công!");

      setCart([]);
      setAppliedVoucher(null);
      setVoucherCode("");
      setNote("");
      setCustomerName("");
      setCustomerPhone("");
      try {
        sessionStorage.removeItem("staff-pos-checkout");
      } catch {}
    } else {
      toast.error(`Thanh toán thất bại: ${message || resultCode}`);
    }

    try {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("resultCode");
      params.delete("message");
      params.delete("orderId");
      router.replace(
        params.toString() ? `?${params.toString()}` : "/staff/menu",
        {
          scroll: false,
        },
      );
    } catch {}
  }, [router, searchParams, tokens.accessToken]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("staff-pos-checkout");
      if (!raw) {
        setIsSessionRestored(true);
        return;
      }

      const payload = JSON.parse(raw) as {
        cart?: unknown;
        orderType?: unknown;
        note?: unknown;
        customerName?: unknown;
        customerPhone?: unknown;
        paymentMethod?: unknown;
        voucherCode?: unknown;
        appliedVoucher?: unknown;
      };

      if (cart.length === 0 && Array.isArray(payload.cart)) {
        setCart(payload.cart as CartItem[]);
      }
      if (typeof payload.orderType === "string") {
        const t = payload.orderType as string;
        if (t === "dine-in" || t === "take-away" || t === "delivery") {
          setOrderType(t);
        }
      }
      if (typeof payload.note === "string" && !note) setNote(payload.note);
      if (typeof payload.customerName === "string" && !customerName) {
        setCustomerName(payload.customerName);
      }
      if (typeof payload.customerPhone === "string" && !customerPhone) {
        setCustomerPhone(payload.customerPhone);
      }
      if (typeof payload.paymentMethod === "string") {
        const pm = payload.paymentMethod as string;
        if (pm === "cash" || pm === "momo") setPaymentMethod(pm);
      }
      if (typeof payload.voucherCode === "string" && !voucherCode) {
        setVoucherCode(payload.voucherCode);
      }
      if (payload.appliedVoucher && !appliedVoucher) {
        setAppliedVoucher(payload.appliedVoucher as Promotion);
      }
    } catch {
      // ignore
    }
    setIsSessionRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        const qs = new URLSearchParams({ page: "0", size: "200" });
        const res = await fetch(`/api/schedules?${qs.toString()}`, {
          cache: "no-store",
          credentials: "same-origin",
        });
        const data = (await res.json().catch(() => null)) as
          | SchedulesResponse
          | { message?: string }
          | null;

        if (!res.ok) return;
        if (!data || typeof data !== "object") return;
        if (
          "code" in data &&
          Number(data.code) === 200 &&
          Array.isArray(data.data)
        ) {
          setSchedules(data.data.filter(Boolean));
        }
      } catch {
        // ignore schedule load errors; fall back to token name + default shift label
      }
    };

    run();
  }, []);

  useEffect(() => {
    if (!isSessionRestored) return;
    try {
      const hasData =
        cart.length > 0 ||
        Boolean(note.trim()) ||
        Boolean(customerName.trim()) ||
        Boolean(customerPhone.trim()) ||
        Boolean(voucherCode.trim()) ||
        Boolean(appliedVoucher);

      if (!hasData) {
        sessionStorage.removeItem("staff-pos-checkout");
        return;
      }

      const prevRaw = sessionStorage.getItem("staff-pos-checkout");
      const prev = prevRaw
        ? (JSON.parse(prevRaw) as { createdAt?: unknown })
        : null;
      const createdAt =
        typeof prev?.createdAt === "number" ? prev.createdAt : Date.now();

      const payload = {
        cart,
        orderType,
        note,
        customerName,
        customerPhone,
        paymentMethod,
        voucherCode,
        appliedVoucher,
        createdAt,
      };

      sessionStorage.setItem("staff-pos-checkout", JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [
    appliedVoucher,
    cart,
    customerName,
    customerPhone,
    isSessionRestored,
    note,
    orderType,
    paymentMethod,
    voucherCode,
  ]);

  useEffect(() => {
    if (cart.length > 0 && createdOrderId !== null) {
      setCreatedOrderId(null);
      setSuccessOrder(null);
      setIsSuccessOpen(false);
    }
  }, [cart.length, createdOrderId]);

  const resetSuccess = () => {
    setCreatedOrderId(null);
    setSuccessOrder(null);
    setIsSuccessOpen(false);
  };

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setNowLabel(formatNowHHmm(now));
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const todayKey = getTodayDayOfWeekKey(now);
      const yesterdayKey = getYesterdayDayOfWeekKey(now);

      const tokenPayload = decodeJwtPayload(tokens.accessToken);
      const tokenEmployeeIdRaw =
        (tokenPayload?.employeeId as unknown) ??
        (tokenPayload?.userId as unknown) ??
        (tokenPayload?.id as unknown);
      const tokenEmployeeId = Number(tokenEmployeeIdRaw);
      const hasEmployeeId =
        Number.isFinite(tokenEmployeeId) && tokenEmployeeId > 0;

      const nowMs = now.getTime();
      const activeSchedules: Array<{
        schedule: ScheduleDto;
        startMs: number;
        endMs: number;
      }> = [];

      for (const s of schedules) {
        const hasDatePart =
          typeof s.startTime === "string" &&
          /\d{4}-\d{2}-\d{2}/.test(s.startTime) &&
          typeof s.endTime === "string" &&
          /\d{4}-\d{2}-\d{2}/.test(s.endTime);

        if (hasDatePart) {
          const startDate = new Date(String(s.startTime));
          const endDate = new Date(String(s.endTime));
          if (
            Number.isNaN(startDate.getTime()) ||
            Number.isNaN(endDate.getTime())
          ) {
            continue;
          }
          const endMs =
            endDate.getTime() <= startDate.getTime()
              ? endDate.getTime() + 24 * 60 * 60 * 1000
              : endDate.getTime();
          const startMs = startDate.getTime();
          if (nowMs >= startMs && nowMs < endMs) {
            activeSchedules.push({ schedule: s, startMs, endMs });
          }
          continue;
        }

        const start = parseTimeToMinutes(s.startTime);
        const end = parseTimeToMinutes(s.endTime);
        if (start === null || end === null) continue;

        const dayKey = normalizeDayOfWeekKey(s.dayOfWeek);
        if (!dayKey) continue; // must be based on today's day-of-week

        const crossesMidnight = end < start;
        const dayMatches = !crossesMidnight
          ? dayKey === todayKey
          : (nowMinutes >= start && dayKey === todayKey) ||
            (nowMinutes < end && dayKey === yesterdayKey);
        if (!dayMatches) continue;

        if (!isMinutesInRange(nowMinutes, start, end)) continue;

        const base = new Date(now);
        base.setHours(0, 0, 0, 0);
        if (crossesMidnight && nowMinutes < end)
          base.setDate(base.getDate() - 1);
        const startMs = base.getTime() + start * 60 * 1000;
        let endMs = base.getTime() + end * 60 * 1000;
        if (crossesMidnight && endMs <= startMs) endMs += 24 * 60 * 60 * 1000;

        if (nowMs >= startMs && nowMs < endMs) {
          activeSchedules.push({ schedule: s, startMs, endMs });
        }
      }

      if (activeSchedules.length > 0) {
        const myActive = hasEmployeeId
          ? (activeSchedules.find(
              (x) => Number(x.schedule.employeeId) === tokenEmployeeId,
            ) ?? null)
          : null;

        const selected =
          myActive ??
          activeSchedules.sort((a, b) => {
            if (b.startMs !== a.startMs) return b.startMs - a.startMs; // closest started to now
            return a.endMs - b.endMs;
          })[0]!;

        const s = selected.schedule;
        setShiftLabel(formatTimeRangeLabel(s.startTime, s.endTime));
        const name =
          (s.employeeName ? String(s.employeeName) : "") ||
          `NV#${Number(s.employeeId) || ""}`;
        setEmployeeLabel(name || "-");
        return;
      }

      // Fallback: common 2 shifts
      const fallback =
        nowMinutes >= 8 * 60 && nowMinutes < 14 * 60
          ? "08:00 - 14:00"
          : nowMinutes >= 14 * 60 && nowMinutes < 22 * 60
            ? "14:00 - 22:00"
            : "-";
      setShiftLabel(fallback);
      setEmployeeLabel("-");
    };

    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [schedules, tokens.accessToken]);

  useEffect(() => {
    const run = async () => {
      setCatLoading(true);
      setCatError(null);
      try {
        const qs = new URLSearchParams({ page: "0", size: "50" });
        const res = await fetch(`/api/categories?${qs.toString()}`, {
          cache: "no-store",
        });
        const data = (await res.json()) as ProductCategoriesResponse;

        if (!res.ok || data?.code !== 200) {
          throw new Error(data?.message || "Load categories failed");
        }

        const items: ProductCategory[] = (data?.data ?? []).filter(
          (c) => !c.status || c.status === "ACTIVE",
        );
        setCategories(items);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load categories failed";
        setCatError(msg);
      } finally {
        setCatLoading(false);
      }
    };

    run();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
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

    run();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!activeCategoryId && categories.length > 0) {
      const firstId = String(categories[0].id);
      const params = new URLSearchParams(searchParams.toString());
      params.set("category", firstId);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [activeCategoryId, categories, router, searchParams]);

  useEffect(() => {
    if (!activeCategoryId) return;

    const run = async () => {
      setMenuLoading(true);
      setMenuError(null);
      try {
        const categoryId = Number(activeCategoryId);
        const result = await getProducts({
          page: menuPage,
          size: MENU_PAGE_SIZE,
          categoryId: Number.isFinite(categoryId) ? categoryId : undefined,
          status: "ACTIVE",
        });

        const items: Product[] = result.data ?? [];
        const mapped: MenuItem[] = items.map((p) => {
          const priceRaw = (p as unknown as { price?: number }).price;
          const price = Number.isFinite(priceRaw) ? Number(priceRaw) : 0;
          return {
            id: p.id,
            name: p.name,
            description: p.description ?? "",
            price,
            image:
              p.image ??
              "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=1200&q=80",
            category: p.categoryName ?? "",
          };
        });

        setMenuItems(mapped);
        setMenuMeta(result.meta ?? null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load products failed";
        setMenuError(msg);
        setMenuMeta(null);
      } finally {
        setMenuLoading(false);
      }
    };

    run();
  }, [activeCategoryId, menuPage]);

  useEffect(() => {
    const run = async () => {
      setTopLoading(true);
      setTopError(null);
      try {
        const qs = new URLSearchParams({ page: "0", size: "50" });
        const res = await fetch(`/api/products/toppings?${qs.toString()}`, {
          cache: "no-store",
        });

        const payload = (await res.json()) as
          | ToppingsResponse
          | { message?: string };

        if (!res.ok) {
          throw new Error(
            ("message" in payload && payload.message) || "Load toppings failed",
          );
        }

        if (!("code" in payload) || payload.code !== 200) {
          throw new Error(
            ("message" in payload && payload.message) || "Load toppings failed",
          );
        }

        const items: SelectedTopping[] = payload.data
          .filter((t) => t.status === "ACTIVE")
          .map((t) => ({
            id: String(t.id),
            name: t.name,
            price: Number(t.price ?? 0),
            quantity: 0,
          }));

        setToppings(items);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load toppings failed";
        setTopError(msg);
        setToppings([]);
      } finally {
        setTopLoading(false);
      }
    };

    run();
  }, []);

  useEffect(() => {
    if (!selectedItem) return;

    const run = async () => {
      setVariantLoading(true);
      setVariantError(null);
      try {
        const variantsRes = await getProductVariants(selectedItem.id);

        let sizesRes: { data?: Size[] } | null = null;
        try {
          sizesRes = await getProductSizes();
        } catch {
          sizesRes = null;
        }

        const variantsData = variantsRes?.data ?? [];
        const sizesData = sizesRes?.data ?? [];

        const sizeOrder: Record<string, number> = {};
        sizesData.forEach((s, idx) => {
          sizeOrder[s.code] = idx + 1;
          sizeOrder[s.name] = idx + 1;
        });

        if (Object.keys(sizeOrder).length === 0) {
          Object.assign(sizeOrder, { S: 1, M: 2, L: 3, XL: 4 });
        }

        variantsData.sort((a, b) => {
          const nameA = getVariantName(a).toUpperCase();
          const nameB = getVariantName(b).toUpperCase();
          const orderA = sizeOrder[nameA] || sizeOrder[a.code] || 99;
          const orderB = sizeOrder[nameB] || sizeOrder[b.code] || 99;
          return orderA - orderB;
        });

        setVariants(variantsData);
        setSelectedVariantId(variantsData[0]?.id ?? null);
        if (variantsData.length === 0) {
          setVariantError("Sản phẩm này chưa có size/biến thể");
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load variants failed";
        setVariantError(msg);
        setVariants([]);
        setSelectedVariantId(null);
      } finally {
        setVariantLoading(false);
      }
    };

    setCustomIce("Bình thường");
    setCustomQty(1);
    setToppings((prev) => prev.map((t) => ({ ...t, quantity: 0 })));
    run();
  }, [selectedItem]);

  const onChangeCategory = (categoryId: string) => {
    setActiveCategoryId(categoryId);
    setMenuPage(0);
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", categoryId);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const filteredMenu = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const activeCategory = categories.find(
      (c) => String(c.id) === activeCategoryId,
    );
    const activeCategoryName = activeCategory?.name?.trim().toLowerCase();
    return menuItems.filter(
      (item) =>
        (!activeCategoryName ||
          item.category.trim().toLowerCase() === activeCategoryName) &&
        (!keyword ||
          item.name.toLowerCase().includes(keyword) ||
          item.tags?.some((t) => t.toLowerCase().includes(keyword))),
    );
  }, [activeCategoryId, categories, menuItems, search]);

  const canPrevMenuPage = !menuLoading && menuPage > 0;
  const canNextMenuPage =
    !menuLoading &&
    (typeof menuMeta?.lastPage === "number"
      ? menuPage + 1 < menuMeta.lastPage
      : menuItems.length === MENU_PAGE_SIZE);

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

  const sameToppings = (a: SelectedTopping[], b: SelectedTopping[]) => {
    if (a.length !== b.length) return false;
    const sa = [...a]
      .map((t) => `${t.id}:${t.quantity}`)
      .sort()
      .join("|");
    const sb = [...b]
      .map((t) => `${t.id}:${t.quantity}`)
      .sort()
      .join("|");
    return sa === sb;
  };

  const activeVariant = useMemo(
    () => variants.find((v) => v.id === selectedVariantId) ?? null,
    [variants, selectedVariantId],
  );

  const selectedToppings = useMemo(
    () => toppings.filter((t) => t.quantity > 0),
    [toppings],
  );

  const toppingTotal = useMemo(
    () => selectedToppings.reduce((sum, t) => sum + t.price * t.quantity, 0),
    [selectedToppings],
  );

  const basePrice =
    activeVariant?.price ??
    (Number.isFinite(selectedItem?.price) ? (selectedItem?.price ?? 0) : 0);

  const perItemPrice = basePrice + toppingTotal;

  const updateToppingQuantity = (id: string, delta: number) => {
    setToppings((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, quantity: Math.max(0, t.quantity + delta) } : t,
      ),
    );
  };

  const addToCart = (item: MenuItem) => {
    if (!activeVariant) return;

    setCart((prev) => {
      const existed = prev.find(
        (c) =>
          c.id === item.id &&
          c.variantId === activeVariant.id &&
          c.size === getVariantName(activeVariant) &&
          c.ice === customIce &&
          sameToppings(c.toppings, selectedToppings),
      );
      if (existed) {
        return prev.map((c) =>
          c.id === item.id &&
          c.variantId === activeVariant.id &&
          c.size === getVariantName(activeVariant) &&
          c.ice === customIce &&
          sameToppings(c.toppings, selectedToppings)
            ? { ...c, quantity: c.quantity + customQty }
            : c,
        );
      }
      return [
        ...prev,
        {
          ...item,
          quantity: customQty,
          variantId: activeVariant.id,
          size: getVariantName(activeVariant),
          ice: customIce,
          toppings: selectedToppings,
          price: perItemPrice,
        },
      ];
    });

    setCustomQty(1);
  };

  const updateQty = (
    id: number,
    variantId: number,
    size: string,
    ice: LevelOption,
    toppings: SelectedTopping[],
    delta: number,
  ) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.id === id &&
          c.variantId === variantId &&
          c.size === size &&
          c.ice === ice &&
          sameToppings(c.toppings, toppings)
            ? { ...c, quantity: Math.max(0, c.quantity + delta) }
            : c,
        )
        .filter((c) => c.quantity > 0),
    );
  };

  const subTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const vat = Math.round(subTotal * 0.08);

  let voucherDiscount = 0;
  if (appliedVoucher) {
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
        voucherDiscount = Math.min(raw, cap);
      } else if (appliedVoucher.discountType === "FIXED_AMOUNT") {
        voucherDiscount = appliedVoucher.discountValue || 0;
      }
    } else if (appliedVoucher.promotionType === "PRODUCT") {
      // Product-level vouchers depend on eligible products; backend will compute final discount.
      voucherDiscount = 0;
    }
  }
  voucherDiscount = Math.max(0, Math.min(voucherDiscount, subTotal + vat));

  const total = Math.max(subTotal + vat - voucherDiscount, 0);

  useEffect(() => {
    if (!appliedVoucher) return;

    const minSpent = Number(appliedVoucher.minimumSpent ?? 0);
    if (Number.isFinite(minSpent) && minSpent > 0 && subTotal < minSpent) {
      setAppliedVoucher(null);
      toast.error(`Đơn tối thiểu ${formatVnd(minSpent)} để dùng voucher này.`);
    }
  }, [appliedVoucher, subTotal]);

  const selectedCartItem = useMemo(() => {
    if (!selectedCartKey) return null;
    return cart.find((c) => getCartItemKey(c) === selectedCartKey) ?? null;
  }, [cart, selectedCartKey]);

  const placeOrder = async () => {
    if (placingOrder) return;
    if (cart.length === 0) {
      toast.error("Chưa có món trong đơn");
      return;
    }

    if (!tokens.accessToken) {
      toast.error("Vui lòng đăng nhập để tạo đơn");
      return;
    }

    setPlacingOrder(true);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("resultCode");
      url.searchParams.delete("message");
      url.searchParams.delete("orderId");
      const returnUrl = url.toString();

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
        paymentGateway: paymentMethod.toUpperCase(),
        ...(returnUrl ? { returnUrl } : {}),
      };

      const res = await createOrder(tokens.accessToken, payload);

      if (paymentMethod === "momo") {
        const payUrl =
          res.payUrl ??
          (await initiatePayment(tokens.accessToken, res.orderId, returnUrl))
            .payUrl;
        if (!payUrl) throw new Error("Không lấy được link thanh toán MoMo");
        window.location.href = payUrl;
        return;
      }

      setCreatedOrderId(res.orderId);
      setSuccessOrder(res);
      setIsSuccessOpen(true);
      toast.success(`Tạo đơn thành công (#${res.orderId})`);

      setCart([]);
      setAppliedVoucher(null);
      setVoucherCode("");
      setNote("");
      setCustomerName("");
      setCustomerPhone("");
      try {
        sessionStorage.removeItem("staff-pos-checkout");
      } catch {}
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

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-12 gap-4">
      {/* Left: menu */}
      <div className="col-span-12 lg:col-span-8 space-y-5 p-4 md:p-6">
        <header className="flex flex-wrap items-center gap-3 justify-between">
          <div>
            <p className="text-xl text-[#693916] font-semibold flex items-center gap-2">
              <Coffee className="w-4 h-4" />
              POS - Order tại quầy
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <Timer className="w-4 h-4" />
            Giờ: {nowLabel}
            <span className="h-4 w-px bg-gray-200" />
            Ca: {shiftLabel}
            <span className="h-4 w-px bg-gray-200" />
            <Users className="w-4 h-4" />
            <span
              className="max-w-[520px] whitespace-normal break-words"
              title={employeeLabel}
            >
              NV: {employeeLabel}
            </span>
          </div>
        </header>

        <div className="flex flex-wrap gap-2">
          {/* Search */}
          <div className="flex items-center gap-1.5 rounded-full bg-white px-2 py-1 shadow-sm border border-gray-100">
            <Search className="w-3.5 h-3.5 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setMenuPage(0);
              }}
              placeholder="Tìm món hoặc tag..."
              className="
          h-7
          border-0
        shadow-none
        focus-visible:ring-0
        text-xs
        min-w-[180px]
        px-1
      "
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          {catLoading && (
            <span className="text-xs text-gray-500">Đang tải danh mục...</span>
          )}
          {catError && <span className="text-xs text-red-600">{catError}</span>}
          {!catLoading &&
            !catError &&
            categories.map((cat) => {
              const idStr = String(cat.id);
              return (
                <Button
                  key={cat.id}
                  size="sm"
                  variant={activeCategoryId === idStr ? "default" : "outline"}
                  className={`rounded-full h-8 px-3 ${
                    activeCategoryId === idStr
                      ? "bg-[#cec3bc] text-[#693916] hover:bg-[#cec3bc] hover:text-[#693916]"
                      : "hover:bg-gray-50 hover:text-[#876F60]"
                  }`}
                  onClick={() => onChangeCategory(idStr)}
                >
                  {cat.name}
                </Button>
              );
            })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
          {menuLoading && (
            <p className="text-sm text-gray-500">Đang tải sản phẩm...</p>
          )}
          {menuError && <p className="text-sm text-red-600">{menuError}</p>}
          {!menuLoading && !menuError && filteredMenu.length === 0 && (
            <p className="text-sm text-gray-500">
              Không có sản phẩm trong danh mục này.
            </p>
          )}
          {filteredMenu.map((item) => (
            <Card
              key={item.id}
              className="h-full flex flex-col overflow-hidden border border-[#cec3bc]/60 shadow-sm hover:shadow-md transition gap-1.5 py-1.5"
            >
              <div
                className="relative w-full aspect-[1/1] cursor-pointer"
                onClick={() => {
                  setSelectedItem(item);
                }}
                role="button"
                tabIndex={0}
              >
                <Image
                  src={safeImageSrc(item.image)}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
                <div className="absolute left-2 top-2 flex flex-col gap-1 items-start">
                  {item.isNew && (
                    <span className="rounded-full bg-[#693916] px-3 py-1 text-[10px] font-semibold text-white shadow-sm">
                      New
                    </span>
                  )}
                  {item.tags?.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-white/85 px-2.5 py-[5px] text-[10px] font-semibold text-[#693916] shadow"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <CardHeader className="px-2 pt-0 pb-0.5">
                <CardTitle className="text-[11px] leading-tight line-clamp-1 min-h-[18px]">
                  {item.name}
                </CardTitle>
                <p className="text-[10px] text-gray-600 line-clamp-1 min-h-[16px]">
                  {item.description}
                </p>
                <p className="text-[11px] font-semibold text-[#693916]">
                  {formatVnd(item.price)}
                </p>
              </CardHeader>

              <CardContent className="mt-auto space-y-1 px-2 pb-1.5">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    onClick={() => {
                      setSelectedItem(item);
                    }}
                    size="sm"
                    className="rounded-full h-7 px-2 text-[10px] bg-[#693916] hover:bg-[#876F60] text-white"
                  >
                    Thêm
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-xs text-gray-500">
            Trang {menuPage + 1}
            {typeof menuMeta?.lastPage === "number"
              ? ` / ${menuMeta.lastPage}`
              : ""}
            {typeof menuMeta?.totalElements === "number"
              ? ` • ${menuMeta.totalElements} sản phẩm`
              : ""}
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 rounded-full p-0"
              onClick={() => setMenuPage((p) => Math.max(0, p - 1))}
              disabled={!canPrevMenuPage}
              type="button"
              aria-label="Trang trước"
              title="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 rounded-full p-0"
              onClick={() =>
                setMenuPage((p) => {
                  const last = menuMeta?.lastPage;
                  if (typeof last === "number")
                    return Math.min(last - 1, p + 1);
                  return p + 1;
                })
              }
              disabled={!canNextMenuPage}
              type="button"
              aria-label="Trang sau"
              title="Trang sau"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Right: cart & payment */}
      <div className="col-span-12 lg:col-span-4 bg-white border border-[#cec3bc]/60 rounded-2xl shadow-sm px-4 lg:px-5 py-6 sticky top-4 max-h-[calc(100vh-48px)] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#693916]" />
            Đơn hiện tại
          </h2>
          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full border border-[#cec3bc]/60">
            {createdOrderId ? `ORD-#${createdOrderId}` : "POS-#A123"}
          </span>
        </div>

        {cart.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#cec3bc]/70 bg-gray-50 p-6 text-center">
            <p className="font-semibold text-stone-900">Chưa có món</p>
            <p className="text-sm text-gray-600">
              Chọn món bên trái để bắt đầu.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => {
              const cartKey = getCartItemKey(item);
              return (
                <div
                  key={cartKey}
                  className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm cursor-pointer hover:shadow-md transition"
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedCartKey(cartKey)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedCartKey(cartKey);
                    }
                  }}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQty(
                            item.id,
                            item.variantId,
                            item.size,
                            item.ice,
                            item.toppings,
                            -1,
                          );
                        }}
                        type="button"
                        aria-label={`Giảm ${item.name}`}
                        title="Giảm"
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold text-stone-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQty(
                            item.id,
                            item.variantId,
                            item.size,
                            item.ice,
                            item.toppings,
                            1,
                          );
                        }}
                        type="button"
                        aria-label={`Tăng ${item.name}`}
                        title="Tăng"
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#693916] text-white hover:bg-[#876F60]"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 space-y-3">
          <Card className="border border-[#cec3bc]/60 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#693916] flex items-center gap-2">
                <TicketPercent className="w-4 h-4" />
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
                  disabled={promoLoading}
                  className="h-9 rounded-full bg-[#693916] hover:bg-[#876F60] text-white px-4 text-xs"
                >
                  Áp dụng
                </Button>
              </div>

              {promoError && (
                <p className="text-xs text-red-600">{promoError}</p>
              )}

              {appliedVoucher ? (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-[#693916] font-semibold">
                    Đã áp dụng: {appliedVoucher.promotionCode}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setVoucherCode("");
                      setAppliedVoucher(null);
                    }}
                    className="text-[11px] font-semibold text-gray-600 hover:text-[#693916]"
                  >
                    Bỏ
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-gray-500">
                  {promoLoading
                    ? "Đang tải voucher..."
                    : "Nhập mã để giảm giá."}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border border-[#cec3bc]/60 bg-gray-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#693916] flex items-center gap-2">
                <TicketPercent className="w-4 h-4" />
                Ghi chú & thông tin khách
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                placeholder="Tên khách"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-white"
              />
              <Input
                placeholder="SĐT / Mã thành viên"
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
              {/* Order type */}
              <div className="flex items-center bg-white rounded-full shadow-sm border border-gray-200 px-1 py-1">
                {(["dine-in", "take-away", "delivery"] as const).map((type) => {
                  const active = orderType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setOrderType(type)}
                      className={`px-4 py-2 text-xs font-semibold rounded-full transition-all ${
                        active
                          ? "bg-[#cec3bc] text-[#693916] shadow-sm"
                          : "text-gray-600 hover:bg-gray-50 hover:text-[#876F60]"
                      }`}
                    >
                      {type === "dine-in" && "Tại chỗ"}
                      {type === "take-away" && "Mang đi"}
                      {type === "delivery" && "Giao tận nơi"}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
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
              <span className="flex items-center gap-2">
                Voucher
                {appliedVoucher && (
                  <span className="text-[11px] text-gray-500">
                    ({appliedVoucher.promotionCode})
                  </span>
                )}
                {appliedVoucher?.promotionType === "PRODUCT" && (
                  <span className="text-[11px] text-gray-500">
                    (tính khi tạo đơn)
                  </span>
                )}
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
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
            <button
              type="button"
              onClick={() => setPaymentMethod("cash")}
              className={`flex-1 h-10 text-xs font-semibold rounded-full border transition-colors ${
                paymentMethod === "cash"
                  ? "bg-[#cec3bc] text-[#693916] border-[#cec3bc]"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Tiền mặt
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("momo")}
              className={`flex-1 h-10 text-xs font-semibold rounded-full border transition-colors ${
                paymentMethod === "momo"
                  ? "bg-[#cec3bc] text-[#693916] border-[#cec3bc]"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              MoMo
            </button>
          </div>

          <Button
            className="w-full h-12 text-base bg-[#693916] hover:bg-[#876F60] text-white disabled:opacity-60 disabled:pointer-events-none"
            type="button"
            onClick={placeOrder}
            disabled={cart.length === 0 || placingOrder}
          >
            {placingOrder
              ? "Đang tạo đơn..."
              : paymentMethod === "momo"
                ? "Thanh toán MoMo"
                : "Xác nhận tiền mặt"}
          </Button>

          <Button
            variant="outline"
            className="w-full h-11 text-sm hover:bg-gray-50 hover:text-[#876F60]"
          >
            Lưu nháp / gửi bếp
          </Button>
        </div>
      </div>

      {/* Success */}
      <Dialog
        open={isSuccessOpen}
        onOpenChange={(open) => !open && resetSuccess()}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Đặt hàng thành công</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center justify-between">
              <span>Mã đơn</span>
              <span className="font-semibold text-stone-900">
                {createdOrderId ? `#${createdOrderId}` : "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Thanh toán</span>
              <span className="font-semibold text-stone-900">
                {successOrder?.paymentGateway
                  ? successOrder.paymentGateway
                  : paymentMethod === "momo"
                    ? "MOMO"
                    : "CASH"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Tổng tiền</span>
              <span className="font-semibold text-[#693916]">
                {typeof successOrder?.paidPrice === "number"
                  ? formatVnd(successOrder.paidPrice)
                  : formatVnd(total)}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={resetSuccess}>
              Tiếp tục bán
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cart item detail */}
      <Dialog
        open={Boolean(selectedCartItem)}
        onOpenChange={(open) => !open && setSelectedCartKey(null)}
      >
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết món</DialogTitle>
          </DialogHeader>

          {selectedCartItem && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-gray-50 border border-gray-100">
                  <Image
                    src={safeImageSrc(selectedCartItem.image)}
                    alt={selectedCartItem.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-900 line-clamp-2">
                    {selectedCartItem.name}
                  </p>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    Size {selectedCartItem.size} • Đá {selectedCartItem.ice}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#693916]">
                      {formatVnd(selectedCartItem.price)}
                    </span>
                    <span className="text-xs text-gray-600">
                      x{selectedCartItem.quantity} ={" "}
                      <span className="font-semibold text-stone-900">
                        {formatVnd(
                          selectedCartItem.price * selectedCartItem.quantity,
                        )}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-stone-900">Số lượng</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateQty(
                        selectedCartItem.id,
                        selectedCartItem.variantId,
                        selectedCartItem.size,
                        selectedCartItem.ice,
                        selectedCartItem.toppings,
                        -1,
                      )
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                    type="button"
                    aria-label="Giảm số lượng"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-stone-900">
                    {selectedCartItem.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQty(
                        selectedCartItem.id,
                        selectedCartItem.variantId,
                        selectedCartItem.size,
                        selectedCartItem.ice,
                        selectedCartItem.toppings,
                        1,
                      )
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#693916] text-white hover:bg-[#876F60]"
                    type="button"
                    aria-label="Tăng số lượng"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-stone-900 mb-1">
                  Topping
                </p>
                {selectedCartItem.toppings.length === 0 ? (
                  <p className="text-xs text-gray-500">Không có topping.</p>
                ) : (
                  <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-2 space-y-2">
                    {selectedCartItem.toppings.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between rounded-lg bg-white border border-gray-200 px-2.5 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-stone-900 line-clamp-1">
                            {t.name}
                          </p>
                          <p className="text-[11px] text-amber-700 font-medium">
                            +{formatVnd(t.price)}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-stone-900">
                          x{t.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setSelectedCartKey(null)}
                >
                  Đóng
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                  onClick={() => {
                    updateQty(
                      selectedCartItem.id,
                      selectedCartItem.variantId,
                      selectedCartItem.size,
                      selectedCartItem.ice,
                      selectedCartItem.toppings,
                      -selectedCartItem.quantity,
                    );
                    setSelectedCartKey(null);
                  }}
                >
                  Xóa món
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal tùy chọn */}
      <Dialog
        open={Boolean(selectedItem)}
        onOpenChange={(open) => !open && setSelectedItem(null)}
      >
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tùy chỉnh món</DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="relative h-20 w-20 rounded-lg overflow-hidden">
                  <Image
                    src={safeImageSrc(selectedItem.image)}
                    alt={selectedItem.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-stone-900">
                    {selectedItem.name}
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {selectedItem.description}
                  </p>
                  <p className="text-base font-semibold text-[#693916] mt-1">
                    {formatVnd(perItemPrice)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-stone-900 mb-1">
                  Size
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {variantLoading && (
                    <p className="text-xs text-gray-500 col-span-4">
                      Đang tải size...
                    </p>
                  )}
                  {variantError && (
                    <p className="text-xs text-red-600 col-span-4">
                      {variantError}
                    </p>
                  )}
                  {!variantLoading &&
                    !variantError &&
                    variants.map((v) => (
                      <Button
                        key={v.id}
                        variant="outline"
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`h-8 text-xs ${
                          selectedVariantId === v.id
                            ? "bg-[#cec3bc] text-[#693916] border-[#cec3bc] hover:bg-[#cec3bc] hover:text-[#693916]"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {getVariantName(v)}
                      </Button>
                    ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-stone-900 mb-1">Đá</p>
                <div className="flex flex-wrap gap-2">
                  {(["Ít", "Bình thường", "Nhiều"] as const).map((opt) => (
                    <Button
                      key={opt}
                      variant="outline"
                      size="sm"
                      className={`h-8 ${
                        customIce === opt
                          ? "bg-[#cec3bc] text-[#693916] border-[#cec3bc] hover:bg-[#cec3bc] hover:text-[#693916]"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => setCustomIce(opt)}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-stone-900">Số lượng</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCustomQty((q) => Math.max(1, q - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-stone-900">
                    {customQty}
                  </span>
                  <button
                    onClick={() => setCustomQty((q) => Math.min(20, q + 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#693916] text-white hover:bg-[#876F60]"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-stone-900">
                    Topping
                  </p>
                  <div className="flex items-center gap-2">
                    {selectedToppings.length > 0 && (
                      <span className="text-[11px] font-semibold text-[#693916] bg-amber-100/80 px-2 py-0.5 rounded-full">
                        Đã chọn {selectedToppings.length}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setToppings((prev) =>
                          prev.map((t) => ({ ...t, quantity: 0 })),
                        )
                      }
                      disabled={selectedToppings.length === 0}
                      className="text-[11px] font-semibold text-gray-600 hover:text-[#693916] disabled:opacity-50"
                    >
                      Xóa
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50/60">
                  {topLoading && (
                    <p className="text-xs text-gray-500 px-3 py-3">
                      Đang tải...
                    </p>
                  )}
                  {topError && (
                    <p className="text-xs text-red-600 px-3 py-3">{topError}</p>
                  )}

                  {!topLoading && !topError && (
                    <div className="max-h-48 overflow-y-auto p-2 space-y-2">
                      {toppings.map((tp) => (
                        <div
                          key={tp.id}
                          className={`flex items-center justify-between gap-3 rounded-lg border px-2.5 py-2 transition-colors ${
                            tp.quantity > 0
                              ? "border-amber-200 bg-amber-50"
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-stone-900 line-clamp-1">
                              {tp.name}
                            </p>
                            <p className="text-[11px] font-medium text-amber-700">
                              +{formatVnd(tp.price)}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => updateToppingQuantity(tp.id, -1)}
                              disabled={tp.quantity === 0}
                              className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                                tp.quantity === 0
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-white text-[#693916] hover:bg-amber-100 border border-amber-200"
                              }`}
                              type="button"
                              aria-label={`Giảm ${tp.name}`}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-stone-900">
                              {tp.quantity}
                            </span>
                            <button
                              onClick={() => updateToppingQuantity(tp.id, 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#693916] text-white hover:bg-[#876F60]"
                              type="button"
                              aria-label={`Tăng ${tp.name}`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                  <span>Tổng topping</span>
                  <span className="font-semibold text-[#693916]">
                    +{formatVnd(toppingTotal)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              onClick={() => setSelectedItem(null)}
              className="h-10"
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (!selectedItem || !activeVariant) return;
                addToCart(selectedItem);
                setSelectedItem(null);
              }}
              className="h-10 bg-[#693916] hover:bg-[#876F60] text-white"
              disabled={!activeVariant}
            >
              Thêm vào giỏ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffPosPage;

const getVariantName = (v: ProductVariant) => {
  if (typeof v.size === "string") return v.size;
  if (v.size && typeof v.size === "object" && "code" in v.size) {
    return (v.size as { code: string }).code;
  }
  if (v.size && typeof v.size === "object" && "name" in v.size) {
    return (v.size as { name: string }).name;
  }
  return v.sizeCode || v.code || v.name || `Size ${v.id}`;
};
