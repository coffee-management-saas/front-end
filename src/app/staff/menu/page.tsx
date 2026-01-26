"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BadgeDollarSign,
  CreditCard,
  Minus,
  Plus,
  QrCode,
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

type Category = "coffee" | "tea" | "cake" | "juice" | "combo";

type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: Category;
  tags?: string[];
  isNew?: boolean;
};

type CartItem = MenuItem & {
  quantity: number;
  note?: string;
  size: "S" | "M" | "L";
  sugar: string;
  ice: string;
  tea: "Ít" | "Vừa" | "Nhiều";
  toppings: string[];
};

const CATEGORIES: { label: string; value: Category }[] = [
  { label: "Cà phê", value: "coffee" },
  { label: "Trà & sữa", value: "tea" },
  { label: "Bánh", value: "cake" },
  { label: "Nước ép", value: "juice" },
  { label: "Combo", value: "combo" },
];

const MENU: MenuItem[] = [
  {
    id: 1,
    name: "Cold Brew Cam Sành",
    description: "Ủ lạnh 18h, cam sành tươi, vị chua ngọt cân bằng",
    price: 58000,
    image:
      "https://i.pinimg.com/736x/5e/fe/ef/5efeefde66fb51a9c3cf727336312d5d.jpg",
    category: "coffee",
    tags: ["Best seller"],
  },
  {
    id: 2,
    name: "Latte Hạnh Nhân",
    description: "Sữa hạnh nhân, shot espresso đôi",
    price: 65000,
    image:
      "https://i.pinimg.com/736x/eb/fa/73/ebfa73187f0aa58158d36d28b86a6532.jpg",
    category: "coffee",
  },
  {
    id: 3,
    name: "Trà Ô Long Sữa Rang",
    description: "Ô long rang, kem sữa, ít đường",
    price: 52000,
    image:
      "https://i.pinimg.com/736x/51/c6/07/51c6075b5b11f4e0cafc153d698fbe8e.jpg",
    category: "tea",
    tags: ["Giảm ngọt"],
  },
  {
    id: 4,
    name: "Trà Đào Cam Sả",
    description: "Đào ngâm, cam vàng, sả tươi",
    price: 49000,
    image:
      "https://i.pinimg.com/1200x/4a/ad/3a/4aad3ab445759dc77d1d0f47818411a6.jpg",
    category: "tea",
    isNew: true,
  },
  {
    id: 5,
    name: "Mousse Matcha",
    description: "Bánh mousse matcha đế chocolate",
    price: 45000,
    image:
      "https://i.pinimg.com/736x/64/d7/2e/64d72e14084b39358fad5c4354c4f05f.jpg",
    category: "cake",
  },
  {
    id: 6,
    name: "Cheesecake Caramel",
    description: "Cheesecake béo nhẹ, sốt caramel muối",
    price: 39000,
    image:
      "https://i.pinimg.com/736x/95/49/0c/95490c7ff1918c006114347b834d6faf.jpg",
    category: "cake",
  },
  {
    id: 7,
    name: "Nước ép Dưa hấu",
    description: "Ép lạnh, không thêm đường",
    price: 42000,
    image:
      "https://i.pinimg.com/736x/4a/0a/0f/4a0a0f55f41ea855c05605765c71be32.jpg",
    category: "juice",
    tags: ["Healthy"],
  },
  {
    id: 8,
    name: "Combo 2 Ly Latte + 1 Bánh",
    description: "Ưu đãi mang đi buổi sáng",
    price: 129000,
    image:
      "https://i.pinimg.com/736x/5e/fe/ef/5efeefde66fb51a9c3cf727336312d5d.jpg",
    category: "combo",
  },
];

const TOPPINGS = [
  "Trân châu",
  "Thạch cà phê",
  "Kem cheese",
  "Pudding trứng",
  "Hạt điều",
];

const formatVnd = (val: number) =>
  val.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const StaffPosPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categoryFromUrl =
    (searchParams.get("category") as Category | null) || "coffee";

  const [activeCategory, setActiveCategory] =
    useState<Category>(categoryFromUrl);
  const [search, setSearch] = useState("");
  const [orderType, setOrderType] = useState<
    "dine-in" | "take-away" | "delivery"
  >("dine-in");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [note, setNote] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [customSize, setCustomSize] = useState<"S" | "M" | "L">("M");
  const [customSugar, setCustomSugar] = useState("50%");
  const [customIce, setCustomIce] = useState("50%");
  const [customTea, setCustomTea] = useState<CartItem["tea"]>("Vừa");
  const [customQty, setCustomQty] = useState(1);
  const [customToppings, setCustomToppings] = useState<string[]>([]);

  useEffect(() => {
    setActiveCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  const onChangeCategory = (cat: Category) => {
    setActiveCategory(cat);
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", cat);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const filteredMenu = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return MENU.filter(
      (item) =>
        item.category === activeCategory &&
        (!keyword ||
          item.name.toLowerCase().includes(keyword) ||
          item.tags?.some((t) => t.toLowerCase().includes(keyword))),
    );
  }, [activeCategory, search]);

  const sameToppings = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    const sa = [...a].sort().join("|");
    const sb = [...b].sort().join("|");
    return sa === sb;
  };

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existed = prev.find(
        (c) =>
          c.id === item.id &&
          c.size === customSize &&
          c.sugar === customSugar &&
          c.ice === customIce &&
          c.tea === customTea &&
          sameToppings(c.toppings, customToppings),
      );
      if (existed) {
        return prev.map((c) =>
          c.id === item.id &&
          c.size === customSize &&
          c.sugar === customSugar &&
          c.ice === customIce &&
          c.tea === customTea &&
          sameToppings(c.toppings, customToppings)
            ? { ...c, quantity: c.quantity + customQty }
            : c,
        );
      }
      return [
        ...prev,
        {
          ...item,
          quantity: customQty,
          size: customSize,
          sugar: customSugar,
          ice: customIce,
          tea: customTea,
          toppings: customToppings,
        },
      ];
    });

    setCustomQty(1);
  };

  const updateQty = (
    id: number,
    size: CartItem["size"],
    sugar: string,
    ice: string,
    tea: CartItem["tea"],
    toppings: string[],
    delta: number,
  ) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.id === id &&
          c.size === size &&
          c.sugar === sugar &&
          c.ice === ice &&
          c.tea === tea &&
          sameToppings(c.toppings, toppings)
            ? { ...c, quantity: Math.max(0, c.quantity + delta) }
            : c,
        )
        .filter((c) => c.quantity > 0),
    );
  };

  const subTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const vat = Math.round(subTotal * 0.08);
  const discount = subTotal >= 200_000 ? 15_000 : 0;
  const total = Math.max(subTotal + vat - discount, 0);

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-12 gap-4">
      {/* Left: menu */}
      <div className="col-span-12 lg:col-span-8 space-y-5 p-4 md:p-6">
        <header className="flex flex-wrap items-center gap-3 justify-between">
          <div>
            <p className="text-xl text-amber-700 font-semibold flex items-center gap-2">
              <Coffee className="w-4 h-4" />
              POS - Order tại quầy
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Timer className="w-4 h-4" />
            Ca hiện tại: 08:00 - 14:00
            <span className="h-4 w-px bg-gray-200" />
            <Users className="w-4 h-4" />
            NV: Nguyen An
          </div>
        </header>

        <div className="flex flex-wrap gap-2">
          {/* Search */}
          <div className="flex items-center gap-1.5 rounded-full bg-white px-2 py-1 shadow-sm border border-gray-100">
            <Search className="w-3.5 h-3.5 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.value}
              size="sm"
              variant={activeCategory === cat.value ? "default" : "outline"}
              className="rounded-full h-8 px-3"
              onClick={() => onChangeCategory(cat.value)}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
          {filteredMenu.map((item) => (
            <Card
              key={item.id}
              className="h-full flex flex-col overflow-hidden border-amber-100 shadow-sm hover:shadow-md transition gap-2 py-2"
            >
              <div
                className="relative w-full aspect-[3/4] cursor-pointer"
                onClick={() => {
                  setSelectedItem(item);
                  setCustomSize("M");
                  setCustomSugar("50%");
                  setCustomIce("50%");
                  setCustomTea("Vừa");
                  setCustomQty(1);
                  setCustomToppings([]);
                }}
                role="button"
                tabIndex={0}
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
                <div className="absolute left-2 top-2 flex flex-col gap-1 items-start">
                  {item.isNew && (
                    <span className="rounded-full bg-amber-700 px-3 py-1 text-[10px] font-semibold text-white shadow-sm">
                      New
                    </span>
                  )}
                  {item.tags?.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-white/85 px-2.5 py-[5px] text-[10px] font-semibold text-amber-800 shadow"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <CardHeader className="px-2 pt-0 pb-1">
                <CardTitle className="text-xs leading-snug line-clamp-2 min-h-[30px]">
                  {item.name}
                </CardTitle>
                <p className="text-[10px] text-gray-600 line-clamp-2 min-h-[26px]">
                  {item.description}
                </p>
              </CardHeader>

              <CardContent className="mt-auto space-y-1.5 px-2 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-amber-800">
                    {formatVnd(item.price)}
                  </p>
                  <Button
                    onClick={() => {
                      setCustomSize("M");
                      setCustomSugar("50%");
                      setCustomIce("50%");
                      setCustomTea("Vừa");
                      setCustomQty(1);
                      addToCart(item);
                    }}
                    size="sm"
                    className="rounded-full h-8 px-2 text-[11px]"
                  >
                    Thêm
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Right: cart & payment */}
      <div className="col-span-12 lg:col-span-4 bg-white border border-amber-100 rounded-2xl shadow-sm px-4 lg:px-5 py-6 sticky top-4 max-h-[calc(100vh-48px)] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-700" />
            Đơn hiện tại
          </h2>
          <span className="text-xs text-gray-500 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
            POS-#A123
          </span>
        </div>

        {cart.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/40 p-6 text-center">
            <p className="font-semibold text-stone-900">Chưa có món</p>
            <p className="text-sm text-gray-600">
              Chọn món bên trái để bắt đầu.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div
                key={`${item.id}-${item.size}-${item.sugar}-${item.ice}-${item.tea}-${[...item.toppings].sort().join("-")}`}
                className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-amber-50">
                    <Image
                      src={item.image}
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
                      Size {item.size} • Đường {item.sugar} • Đá {item.ice} •
                      Trà {item.tea}
                    </p>
                    <p className="text-sm font-semibold text-amber-800">
                      {formatVnd(item.price)}
                    </p>
                    {item.toppings.length > 0 && (
                      <p className="text-[11px] text-gray-500 line-clamp-1">
                        Topping: {item.toppings.join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateQty(
                          item.id,
                          item.size,
                          item.sugar,
                          item.ice,
                          item.tea,
                          item.toppings,
                          -1,
                        )
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-stone-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQty(
                          item.id,
                          item.size,
                          item.sugar,
                          item.ice,
                          item.tea,
                          item.toppings,
                          1,
                        )
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-700 text-white hover:bg-amber-800"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 space-y-3">
          <Card className="border-amber-100 bg-amber-50/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-amber-900 flex items-center gap-2">
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
                          ? "bg-amber-700 text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-100"
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
              <span>Giảm</span>
              <span className="font-semibold text-amber-700">
                -{formatVnd(discount)}
              </span>
            </div>
            <div className="h-px bg-gray-100 my-1" />
            <div className="flex justify-between text-base font-bold text-amber-800">
              <span>Tổng thanh toán</span>
              <span>{formatVnd(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button className="h-10 text-xs gap-1.5" variant="outline">
              <BadgeDollarSign className="w-3.5 h-3.5" />
              Tiền mặt
            </Button>
            <Button className="h-10 text-xs gap-1.5" variant="outline">
              <CreditCard className="w-3.5 h-3.5" />
              Thẻ
            </Button>
            <Button className="h-10 text-xs gap-1.5" variant="outline">
              <QrCode className="w-3.5 h-3.5" />
              QR
            </Button>
          </div>

          <Button className="w-full h-12 text-base">
            In hóa đơn & Thanh toán
          </Button>

          <Button variant="outline" className="w-full h-11 text-sm">
            Lưu nháp / gửi bếp
          </Button>
        </div>
      </div>

      {/* Modal tùy chọn */}
      <Dialog
        open={Boolean(selectedItem)}
        onOpenChange={(open) => !open && setSelectedItem(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tùy chỉnh món</DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="relative h-20 w-20 rounded-lg overflow-hidden">
                  <Image
                    src={selectedItem.image}
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
                  <p className="text-base font-semibold text-amber-800 mt-1">
                    {formatVnd(selectedItem.price)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(["S", "M", "L"] as const).map((sz) => (
                  <Button
                    key={sz}
                    variant={customSize === sz ? "default" : "outline"}
                    onClick={() => setCustomSize(sz)}
                    className="h-9 text-sm"
                  >
                    Size {sz}
                  </Button>
                ))}
              </div>

              <div>
                <p className="text-sm font-semibold text-stone-900 mb-1">
                  Đường
                </p>
                <div className="flex flex-wrap gap-2">
                  {["0%", "30%", "50%", "70%", "100%"].map((opt) => (
                    <Button
                      key={opt}
                      variant={customSugar === opt ? "default" : "outline"}
                      size="sm"
                      className="h-8"
                      onClick={() => setCustomSugar(opt)}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-stone-900 mb-1">Đá</p>
                <div className="flex flex-wrap gap-2">
                  {["0%", "30%", "50%", "70%", "100%"].map((opt) => (
                    <Button
                      key={opt}
                      variant={customIce === opt ? "default" : "outline"}
                      size="sm"
                      className="h-8"
                      onClick={() => setCustomIce(opt)}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-stone-900 mb-1">
                  Lượng trà
                </p>
                <div className="flex flex-wrap gap-2">
                  {(["Ít", "Vừa", "Nhiều"] as const).map((opt) => (
                    <Button
                      key={opt}
                      variant={customTea === opt ? "default" : "outline"}
                      size="sm"
                      className="h-8"
                      onClick={() => setCustomTea(opt)}
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
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-700 text-white hover:bg-amber-800"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-stone-900 mb-1">
                  Topping
                </p>
                <div className="flex flex-wrap gap-2">
                  {TOPPINGS.map((tp) => {
                    const active = customToppings.includes(tp);
                    return (
                      <Button
                        key={tp}
                        variant={active ? "default" : "outline"}
                        size="sm"
                        className="h-8"
                        onClick={() =>
                          setCustomToppings((prev) =>
                            prev.includes(tp)
                              ? prev.filter((t) => t !== tp)
                              : [...prev, tp],
                          )
                        }
                      >
                        {tp}
                      </Button>
                    );
                  })}
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
                if (selectedItem) {
                  addToCart(selectedItem);
                }
                setSelectedItem(null);
              }}
              className="h-10"
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
