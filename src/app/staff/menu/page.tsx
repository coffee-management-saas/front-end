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
import { ProductCategoriesResponse, ProductCategory } from "@/types/catagories";
import {
  getProductSizes,
  getProductVariants,
  getProducts,
} from "@/services/product.service";
import type { Product, ProductVariant, Size } from "@/types/product";
import type { ToppingItem, ToppingsResponse } from "@/types/topping";

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

const formatVnd = (val: number) =>
  val.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const StaffPosPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);

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
  const [note, setNote] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [customIce, setCustomIce] = useState<LevelOption>("Bình thường");
  const [customQty, setCustomQty] = useState(1);
  const [toppings, setToppings] = useState<ToppingItem[]>([]);
  const [topLoading, setTopLoading] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantLoading, setVariantLoading] = useState(false);
  const [variantError, setVariantError] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    setActiveCategoryId(categoryIdFromUrl);
  }, [categoryIdFromUrl]);

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
          page: 0,
          size: 50,
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
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Load products failed";
        setMenuError(msg);
      } finally {
        setMenuLoading(false);
      }
    };

    run();
  }, [activeCategoryId]);

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

        const items: ToppingItem[] = payload.data
          .filter((t) => t.status === "ACTIVE")
          .map((t) => ({
            id: String(t.id),
            name: t.name,
            price: t.price,
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
        const [variantsRes, sizesRes] = await Promise.all([
          getProductVariants(selectedItem.id).catch(() => ({ data: [] })),
          getProductSizes().catch(() => ({ data: [] })),
        ]);

        const variantsData =
          (variantsRes as { data?: ProductVariant[] }).data || [];
        const sizesData = (sizesRes as { data?: Size[] }).data || [];
        setSizes(sizesData);

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
                  className="rounded-full h-8 px-3"
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
              className="h-full flex flex-col overflow-hidden border-amber-100 shadow-sm hover:shadow-md transition gap-1.5 py-1.5"
            >
              <div
                className="relative w-full aspect-square cursor-pointer"
                onClick={() => {
                  setSelectedItem(item);
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

              <CardHeader className="px-2 pt-0 pb-0.5">
                <CardTitle className="text-[11px] leading-tight line-clamp-1 min-h-[18px]">
                  {item.name}
                </CardTitle>
                <p className="text-[10px] text-gray-600 line-clamp-1 min-h-[16px]">
                  {item.description}
                </p>
              </CardHeader>

              <CardContent className="mt-auto space-y-1 px-2 pb-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Button
                    onClick={() => {
                      setSelectedItem(item);
                    }}
                    size="sm"
                    className="rounded-full h-7 px-2 text-[10px]"
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
                key={`${item.id}-${item.variantId}-${item.size}-${item.ice}-${item.toppings
                  .map((t) => `${t.id}:${t.quantity}`)
                  .sort()
                  .join("-")}`}
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
                      Size {item.size} • Đá {item.ice}
                    </p>
                    <p className="text-sm font-semibold text-amber-800">
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
                      onClick={() =>
                        updateQty(
                          item.id,
                          item.variantId,
                          item.size,
                          item.ice,
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
                          item.variantId,
                          item.size,
                          item.ice,
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
                        variant={
                          selectedVariantId === v.id ? "default" : "outline"
                        }
                        onClick={() => setSelectedVariantId(v.id)}
                        className="h-8 text-xs"
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
                  {topLoading && (
                    <p className="text-xs text-gray-500">Đang tải...</p>
                  )}
                  {topError && (
                    <p className="text-xs text-red-600">{topError}</p>
                  )}
                  {!topLoading &&
                    !topError &&
                    toppings.map((tp) => (
                      <div
                        key={tp.id}
                        className="flex items-center gap-2 rounded-full border border-gray-200 px-2 py-1"
                      >
                        <span className="text-xs text-gray-700">{tp.name}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateToppingQuantity(tp.id, -1)}
                            disabled={tp.quantity === 0}
                            className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-gray-600 disabled:opacity-50"
                            type="button"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-4 text-center text-xs font-semibold text-stone-900">
                            {tp.quantity}
                          </span>
                          <button
                            onClick={() => updateToppingQuantity(tp.id, 1)}
                            className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-700 text-white"
                            type="button"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
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
              className="h-10"
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
