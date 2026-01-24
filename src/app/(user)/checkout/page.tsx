"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type DeliveryMethod = "delivery" | "pickup";

type CartItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  quantity: number;
  size: "S" | "M" | "L";
  ice: string;
  sugar: string;
  tags?: string[];
  note?: string;
};

type Suggestion = {
  id: number;
  name: string;
  price: number;
  image: string;
  accent?: string;
};

const INITIAL_ITEMS: CartItem[] = [
  {
    id: 1,
    name: "Cold Brew Cam Sành",
    description: "Ủ lạnh 18h, mix cam sành tươi, vị chua ngọt cân bằng",
    price: 58000,
    image:
      "https://i.pinimg.com/736x/5e/fe/ef/5efeefde66fb51a9c3cf727336312d5d.jpg",
    quantity: 1,
    size: "M",
    ice: "70%",
    sugar: "50%",
    tags: ["Best seller", "Fresh"],
    note: "Để riêng đá",
  },
  {
    id: 2,
    name: "Trà Ô Long Sữa Rang",
    description: "Ô long rang, kem sữa mượt, topping trân châu đen",
    price: 52000,
    image:
      "https://i.pinimg.com/736x/51/c6/07/51c6075b5b11f4e0cafc153d698fbe8e.jpg",
    quantity: 2,
    size: "L",
    ice: "50%",
    sugar: "30%",
    tags: ["Ít đường"],
  },
  {
    id: 3,
    name: "Bánh Mousse Matcha",
    description: "Mousse vị matcha, đế chocolate, ngọt nhẹ",
    price: 45000,
    image:
      "https://i.pinimg.com/736x/64/d7/2e/64d72e14084b39358fad5c4354c4f05f.jpg",
    quantity: 1,
    size: "M",
    ice: "0%",
    sugar: "100%",
    tags: ["Ăn kèm"],
  },
];

const SUGGESTIONS: Suggestion[] = [
  {
    id: 101,
    name: "Trà Đào Cam Sả",
    price: 49000,
    image:
      "https://i.pinimg.com/1200x/4a/ad/3a/4aad3ab445759dc77d1d0f47818411a6.jpg",
    accent: "Mát lạnh",
  },
  {
    id: 102,
    name: "Cheesecake Caramel",
    price: 39000,
    image:
      "https://i.pinimg.com/736x/95/49/0c/95490c7ff1918c006114347b834d6faf.jpg",
    accent: "Thêm ngọt",
  },
  {
    id: 103,
    name: "Hạt điều rang bơ",
    price: 35000,
    image:
      "https://i.pinimg.com/736x/4a/0a/0f/4a0a0f55f41ea855c05605765c71be32.jpg",
    accent: "Ăn vặt",
  },
];

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

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>(INITIAL_ITEMS);
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("delivery");
  const [voucherCode, setVoucherCode] = useState("WELCOME10");
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(
    "WELCOME10",
  );
  const [note, setNote] = useState("");

  const freeShipThreshold = 150_000;

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const shipping = deliveryMethod === "delivery" ? 15000 : 0;
    const voucherDiscount = appliedVoucher
      ? Math.min(subtotal * 0.1, 40000)
      : 0;
    const total = Math.max(subtotal + shipping - voucherDiscount, 0);

    return { subtotal, shipping, voucherDiscount, total };
  }, [items, deliveryMethod, appliedVoucher]);

  const handleQuantityChange = (id: number, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: Math.min(Math.max(item.quantity + delta, 1), 10),
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const handleRemoveItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleApplyVoucher = () => {
    setAppliedVoucher(
      voucherCode.trim() ? voucherCode.trim().toUpperCase() : null,
    );
  };

  const handleAddSuggestion = (suggestion: Suggestion) => {
    setItems((prev) => {
      const exist = prev.find((item) => item.id === suggestion.id);

      if (exist) {
        return prev.map((item) =>
          item.id === suggestion.id
            ? { ...item, quantity: Math.min(item.quantity + 1, 10) }
            : item,
        );
      }

      return [
        ...prev,
        {
          id: suggestion.id,
          name: suggestion.name,
          description: suggestion.accent || "Món kèm",
          price: suggestion.price,
          image: suggestion.image,
          quantity: 1,
          size: "M",
          ice: "100%",
          sugar: "100%",
          tags: ["Thêm mới"],
        },
      ];
    });
  };

  const remainingForFreeShip = Math.max(freeShipThreshold - totals.subtotal, 0);
  const isEmpty = items.length === 0;

  return (
    <div className="min-h-screen bg-white via-white to-white pt-10">
      <div className="container mx-auto px-4 lg:px-8 py-10 space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-amber-800">
              Đơn hàng hôm nay
            </p>
            <h1 className="text-3xl font-semibold text-stone-900 mt-1">
              Giỏ hàng của bạn
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Kiểm tra món, chọn ưu đãi, ghi chú nhanh trước khi thanh toán.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {STEP_ITEMS.map((step, idx) => {
              const isActive = idx === 0;
              return (
                <div key={step.title} className="flex items-center gap-3">
                  <div
                    className={cn(
                      "rounded-full px-3 py-2 border shadow-sm",
                      isActive
                        ? "border-amber-200 bg-white text-amber-800"
                        : "border-gray-200 bg-white text-gray-500",
                    )}
                  >
                    <p className="text-xs font-semibold leading-tight">
                      Bước {idx + 1}
                    </p>
                    <p className="text-xs">{step.title}</p>
                  </div>
                  {idx < STEP_ITEMS.length - 1 && (
                    <div className="h-px w-6 bg-gradient-to-r from-amber-300 to-gray-200" />
                  )}
                </div>
              );
            })}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <Card className="border-amber-100 bg-white/80 shadow-sm">
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

                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm border border-amber-100">
                    <Clock3 className="w-4 h-4 text-amber-700" />
                    Dự kiến: 25-35 phút
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm border border-amber-100">
                    <MapPin className="w-4 h-4 text-amber-700" />
                    42 Nguyễn Huệ, Quận 1, TP.HCM
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm border border-amber-100">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    Niêm phong & kèm hóa đơn
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-100 bg-white/90 shadow-md">
              <CardHeader className="flex flex-col gap-1">
                <CardTitle className="text-xl">Danh sách món</CardTitle>
                <CardDescription>
                  {items.length} sản phẩm · Điều chỉnh nhanh số lượng, topping,
                  ghi chú.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEmpty ? (
                  <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/40 p-6 text-center">
                    <p className="text-lg font-semibold text-stone-900">
                      Giỏ hàng đang trống
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Bắt đầu với một ly Cold Brew hoặc bánh ngọt?
                    </p>
                    <div className="mt-4 flex justify-center gap-3">
                      <Button asChild variant="outline">
                        <Link href="/menu/beverages">Khám phá đồ uống</Link>
                      </Button>
                      <Button asChild>
                        <Link href="/promotions">Xem khuyến mãi</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  items.map((item) => (
                    <CartItemRow
                      key={item.id}
                      item={item}
                      onChangeQty={handleQuantityChange}
                      onRemove={handleRemoveItem}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-amber-100 bg-white/80 shadow-sm">
              <CardHeader className="flex flex-col gap-2">
                <CardTitle className="text-lg">Ghi chú cho barista</CardTitle>
                <CardDescription>
                  Ví dụ: “Ít đá, đừng bỏ ống hút”, “Gọi trước khi giao”...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Thêm lưu ý để món chuẩn vị hơn."
                  className="min-h-[110px]"
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-28">
            <Card className="border-amber-200 bg-white shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between text-xl">
                  Tóm tắt đơn
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800">
                    {items.length} món
                  </span>
                </CardTitle>
                <CardDescription>
                  Kiểm tra ưu đãi, phí giao và tổng thanh toán.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2 rounded-lg border border-amber-100 bg-amber-50/50 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-amber-900">
                    <Gift className="w-4 h-4" />
                    Ưu đãi & mã giảm giá
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      placeholder="Nhập mã (FREESHIP, WELCOME10...)"
                      className="bg-white"
                    />
                    <Button onClick={handleApplyVoucher} className="shrink-0">
                      Áp dụng
                    </Button>
                  </div>
                  {appliedVoucher ? (
                    <p className="text-xs text-amber-800">
                      Đã áp dụng mã <strong>{appliedVoucher}</strong> · Giảm tối
                      đa 40.000đ
                    </p>
                  ) : (
                    <p className="text-xs text-gray-600">
                      Chọn mã để tối ưu chi phí giao hàng.
                    </p>
                  )}
                </div>

                <div className="space-y-2 text-sm">
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

                <div className="rounded-xl border-amber-100 bg-amber-50/50 text-white p-4 shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-black">Cần đạt</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(
                          Math.max(freeShipThreshold, totals.total),
                        )}
                      </p>
                      <p className="text-xs text-black">
                        Miễn phí giao nội thành cho đơn từ 150.000đ
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-black">Tổng thanh toán</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(totals.total)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/15">
                    <div
                      className="h-2 rounded-full bg-amber-800 transition-all"
                      style={{
                        width: `${Math.min(
                          (totals.subtotal / freeShipThreshold) * 100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs">
                    {remainingForFreeShip > 0 ? (
                      <span>
                        Mua thêm {formatCurrency(remainingForFreeShip)} để được
                        freeship.
                      </span>
                    ) : (
                      <span className="font-semibold text-amber-50">
                        Tuyệt! Đơn đã đủ điều kiện freeship nội thành.
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <Button className="w-full h-12 text-base">
                    Tiếp tục thanh toán
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" className="w-full h-11 text-base">
                    Đặt thêm món
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-100 bg-amber-50/60">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-amber-900">
                  <Sparkles className="w-4 h-4" />
                  Mẹo nhỏ
                </CardTitle>
                <CardDescription className="text-sm text-amber-800">
                  Lưu sản phẩm yêu thích, hoặc tách hóa đơn khi thanh toán tại
                  quầy.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-amber-900">
                <p>· Thêm ống hút gỗ miễn phí ở phần ghi chú.</p>
                <p>· Đơn doanh nghiệp? Nhập MST vào ghi chú để xuất hóa đơn.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-amber-100 bg-white shadow-sm">
          <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl">Thêm nhanh món ăn kèm</CardTitle>
              <CardDescription>
                Gợi ý món hợp vị, tăng giá trị đơn và đạt freeship nhanh hơn.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SUGGESTIONS.map((sug) => (
              <div
                key={sug.id}
                className="group rounded-xl border border-amber-100 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative h-32 w-full overflow-hidden rounded-lg bg-amber-50">
                  <Image
                    src={sug.image}
                    alt={sug.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-stone-900">{sug.name}</p>
                    <p className="text-sm text-amber-800">
                      {formatCurrency(sug.price)}
                    </p>
                    {sug.accent && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
                        <Sparkles className="w-3 h-3" />
                        {sug.accent}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddSuggestion(sug)}
                    className="shrink-0"
                  >
                    Thêm
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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

function CartItemRow({
  item,
  onChangeQty,
  onRemove,
}: {
  item: CartItem;
  onChangeQty: (id: number, delta: number) => void;
  onRemove: (id: number) => void;
}) {
  return (
    <div className="group relative flex flex-col gap-3 rounded-xl border border-amber-100 bg-white/80 p-4 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md">
      <button
        onClick={() => onRemove(item.id)}
        className="absolute right-3 top-3 rounded-full p-2 text-gray-400 transition hover:bg-amber-50 hover:text-amber-800"
        aria-label={`Xóa ${item.name}`}
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="flex gap-4">
        <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-amber-50">
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="96px"
            className="object-cover"
          />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold text-stone-900">
              {item.name}
            </p>
            {item.tags?.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-600">{item.description}</p>

          <div className="flex flex-wrap gap-2 text-xs font-semibold text-amber-800">
            <span className="rounded-full bg-amber-50 px-3 py-1">
              Size {item.size}
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-1">
              Đá {item.ice}
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-1">
              Đường {item.sugar}
            </span>
          </div>

          {item.note && (
            <p className="text-xs text-gray-500">
              Ghi chú: <span className="italic">{item.note}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChangeQty(item.id, -1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-200 text-amber-800 transition hover:bg-amber-50"
            aria-label="Giảm số lượng"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="min-w-[32px] text-center text-base font-semibold text-stone-900">
            {item.quantity}
          </span>
          <button
            onClick={() => onChangeQty(item.id, 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-200 bg-amber-800 text-white transition hover:bg-amber-900"
            aria-label="Tăng số lượng"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-500">Tạm tính</p>
          <p className="text-lg font-semibold text-amber-800">
            {formatCurrency(item.price * item.quantity)}
          </p>
        </div>
      </div>
    </div>
  );
}
