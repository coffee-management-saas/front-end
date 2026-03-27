"use client";

import { cn, formatCurrency, canUseImage, FALLBACK_IMG } from "@/lib/utils";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Minus,
  Plus,
  Flame,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import type {
  ApiEnvelope,
  Product,
  ProductVariant,
  Size,
} from "@/types/product";
import { ToppingsResponse } from "@/types/topping";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import {
  getProductVariants,
  getProductSizes,
} from "@/services/product.service";
import { toast } from "sonner";
import { triggerFlyToCart } from "@/components/FlyingCartAnimation";

type LevelOption = "Ít" | "Bình thường" | "Nhiều";

interface Topping {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface SuggestItem {
  id: number;
  name: string;
  price: number;
  image: string;
  categoryName?: string;
  description?: string;
  isBestSeller?: boolean;
}
interface ProductListMeta {
  currentPage: number;
  size: number;
  lastPage: number;
  totalElements: number;
}
interface ProductListResponse {
  code: number;
  status: string;
  message: string;
  data: Product[];
  meta: ProductListMeta;
}

const getVariantName = (v: ProductVariant) => {
  if (typeof v.size === "string") return v.size;
  if (v.size && typeof v.size === "object") {
    const sizeObj = v.size as { code?: unknown; name?: unknown };
    if (typeof sizeObj.code === "string") return sizeObj.code;
    if (typeof sizeObj.name === "string") return sizeObj.name;
  }
  return v.sizeCode || v.code || v.name || `Size ${v.id}`;
};

const DetailProduct: React.FC = () => {
  const params = useParams<{ slug: string }>();
  const productId = useMemo(
    () => extractIdFromSlug(params?.slug),
    [params?.slug],
  );

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    null,
  );
  const bestSellerRef = useRef<HTMLDivElement>(null);
  const [selectedIce, setSelectedIce] = useState<LevelOption>("Nhiều");
  const [quantity, setQuantity] = useState<number>(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coffeeItems, setCoffeeItems] = useState<SuggestItem[]>([]);

  const [toppings, setToppings] = useState<Topping[]>([]);
  const [topLoading, setTopLoading] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);

  const { addItem } = useCart();
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      setTopLoading(true);
      setTopError(null);
      try {
        const qs = new URLSearchParams({ page: "0", size: "10" });

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

        const items: Topping[] = payload.data
          .filter((t) => t.status === "ACTIVE")
          .map((t) => ({
            id: String(t.id),
            name: t.name,
            price: t.price,
            quantity: 0,
          }));

        setToppings(items);
      } catch (e) {
        setTopError(e instanceof Error ? e.message : "Load toppings failed");
        setToppings([]);
      } finally {
        setTopLoading(false);
      }
    };

    run();
  }, []);

  useEffect(() => {
    if (!productId) {
      setError("Thiếu mã sản phẩm trong URL.");
      setProduct(null);
      return;
    }
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const [productRes, variantsRes, sizesRes] = await Promise.all([
          fetch(`/api/products/${productId}`, { cache: "no-store" }),
          getProductVariants(productId).catch(() => ({ data: [] })),
          getProductSizes().catch(() => ({ data: [] })),
        ]);

        const productPayload = (await productRes.json()) as
          | ApiEnvelope<Product>
          | { message?: string };
        if (
          !productRes.ok ||
          ("code" in productPayload && productPayload.code !== 200)
        ) {
          throw new Error(
            ("message" in productPayload && productPayload.message) ||
              "Load product failed",
          );
        }
        if ("data" in productPayload) {
          setProduct(productPayload.data as Product);
        }

        const variantsData =
          (variantsRes as ApiEnvelope<ProductVariant[]>).data || [];
        const sizesData = (sizesRes as ApiEnvelope<Size[]>).data || [];

        const sizeOrder: Record<string, number> = {};
        sizesData.forEach((s, idx) => {
          sizeOrder[s.code] = idx + 1;
          sizeOrder[s.name] = idx + 1;
        });

        // Fallback if no sizes loaded
        if (Object.keys(sizeOrder).length === 0) {
          Object.assign(sizeOrder, { S: 1, M: 2, L: 3, XL: 4 });
        }

        variantsData.sort((a, b) => {
          const nameA = getVariantName(a).toUpperCase();
          const nameB = getVariantName(b).toUpperCase();
          // Try to match name or code
          const orderA = sizeOrder[nameA] || sizeOrder[a.code] || 99;
          const orderB = sizeOrder[nameB] || sizeOrder[b.code] || 99;
          return orderA - orderB;
        });

        setVariants(variantsData);

        if (variantsData.length > 0) {
          setSelectedVariantId(variantsData[0].id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Load product failed");
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [productId]);

  useEffect(() => {
    if (!product?.categoryId) return;

    const run = async () => {
      try {
        const qs = new URLSearchParams({
          page: "0",
          size: "10",
          categoryId: String(product.categoryId),
          status: "ACTIVE",
        });

        const res = await fetch(`/api/products?${qs.toString()}`, {
          cache: "no-store",
        });

        const payload = (await res.json()) as
          | ProductListResponse
          | { message?: string };

        if (!res.ok) {
          throw new Error(
            ("message" in payload && payload.message) ||
              "Load suggestions failed",
          );
        }

        if (!("code" in payload) || payload.code !== 200) {
          throw new Error(
            ("message" in payload && payload.message) ||
              "Load suggestions failed",
          );
        }

        const mapped: SuggestItem[] = payload.data
          .filter((p: Product) => p.id !== product.id)
          .map((p: Product) => ({
            id: p.id,
            name: p.name,
            price: p.price ?? 0,
            image: canUseImage(p.image) ? (p.image as string) : FALLBACK_IMG,
            categoryName:
              typeof p.categoryName === "string" ? p.categoryName : "",
            description: typeof p.description === "string" ? p.description : "",
            isBestSeller: Boolean(
              p?.isBestSeller ?? p?.bestSeller ?? p?.isPopular ?? false,
            ),
          }));

        setCoffeeItems(mapped);
      } catch {
        setCoffeeItems([]);
      }
    };

    run();
  }, [product?.categoryId, product?.id]);

  const scrollLeft = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollBy({ left: -200, behavior: "smooth" });
  };
  const scrollRight = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollBy({ left: 200, behavior: "smooth" });
  };

  const activeVariant = useMemo(() => {
    return variants.find((v) => v.id === selectedVariantId);
  }, [variants, selectedVariantId]);

  const item = useMemo(() => {
    return {
      name: product?.name ?? "Đang tải...",
      image: canUseImage(product?.image)
        ? (product?.image as string)
        : FALLBACK_IMG,
      sku: activeVariant?.skuCode || product?.id || 0,
      categoryName: product?.categoryName ?? "",
      description: product?.description ?? "",
    };
  }, [product, activeVariant]);

  // Prefer variant price; fallback to product price when variants are unavailable.
  const productPrice = activeVariant?.price ?? product?.price ?? 0;

  // No more manual size delta, the variant has the full price

  const updateToppingQuantity = (id: string, delta: number) => {
    setToppings((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, quantity: Math.max(0, t.quantity + delta) } : t,
      ),
    );
  };

  const toppingTotal = useMemo(
    () => toppings.reduce((sum, t) => sum + t.price * t.quantity, 0),
    [toppings],
  );

  const totalPrice = (productPrice + toppingTotal) * quantity;
  const selectedSizeLabel = activeVariant
    ? getVariantName(activeVariant)
    : null;
  const selectedToppings = toppings.filter((t) => t.quantity > 0);
  const availabilityLabel =
    product?.status === "ACTIVE" ? "Còn hàng" : "Tạm hết";

  const handleSubmitSelection = (options?: {
    triggerEl?: HTMLElement | null;
    buyNow?: boolean;
  }) => {
    if (!product) return;

    if (!activeVariant) {
      toast.error("Vui lòng chọn kích cỡ");
      return;
    }

    addItem({
      productId: product.id,
      productName: product.name,
      productImage: canUseImage(product.image)
        ? (product.image as string)
        : FALLBACK_IMG,
      variantId: activeVariant.id,
      size: getVariantName(activeVariant),
      basePrice: productPrice,
      quantity,
      toppings: selectedToppings.map((t) => ({
        id: Number(t.id),
        name: t.name,
        price: t.price,
        quantity: t.quantity,
      })),
      iceLevel: selectedIce,
    });

    if (options?.triggerEl) {
      triggerFlyToCart(
        canUseImage(product.image) ? (product.image as string) : FALLBACK_IMG,
        options.triggerEl,
      );
    }

    toast.success("Đã thêm vào giỏ hàng!");
    setQuantity(1);

    if (options?.buyNow) {
      router.push("/checkout");
    }
  };

  if (loading) return null;
  if (error) return <div className="p-6 pt-24 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F7F5] to-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Breadcrumb with Back Button */}
        <div className="pt-6 pb-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-[#693916] transition-colors group"
          >
            <span className="text-sm font-medium">Quay lại</span>
          </button>
          <span className="text-gray-300">|</span>
          <div className="text-sm text-gray-500">
            Trang chủ /{" "}
            <span className="text-[#693916] font-medium">
              Chi tiết sản phẩm
            </span>
          </div>
        </div>

        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-4">
          {/* Product Image - takes 5 cols */}
          <div className="lg:col-span-5 relative">
            <div>
              <div className="relative h-[320px] md:h-[440px] lg:h-[560px] rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-amber-50 to-orange-50">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                  priority
                />
                {/* Decorative Corner */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/30 to-transparent rounded-bl-full"></div>
              </div>
            </div>
          </div>

          {/* Product Details - takes 7 cols */}
          <div className="lg:col-span-7">
            <div className="mx-auto max-w-[560px] space-y-4.5">
              <div className="space-y-2">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#9c836e]">
                  {item.categoryName || "Đồ uống"}
                </p>
                <h1 className="text-[20px] font-medium leading-tight text-[#111111] md:text-[22px]">
                  {item.name}
                  {selectedSizeLabel ? ` - Size ${selectedSizeLabel}` : ""}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#5f5851]">
                  <span>
                    Tình trạng:{" "}
                    <span className="font-medium text-[#7a4a2a]">
                      {availabilityLabel}
                    </span>
                  </span>
                  <span className="text-[#d5c8bc]">|</span>
                  <span>
                    Mã SKU:{" "}
                    <span className="font-medium text-[#7a4a2a]">
                      {item.sku}
                    </span>
                  </span>
                </div>
              </div>

              <div className="border-y border-[#e8ddd2] py-4.5">
                <p className="text-[28px] font-semibold leading-none tracking-tight text-[#7a4a2a] md:text-[30px]">
                  {formatCurrency(productPrice)}
                </p>
                {(quantity > 1 || toppingTotal > 0) && (
                  <p className="mt-1.5 text-[11px] text-[#85786d]">
                    Tạm tính: {formatCurrency(totalPrice)}
                  </p>
                )}
              </div>

              {item.description && (
                <p className="text-[13px] leading-6 text-[#6d6258]">
                  {item.description}
                </p>
              )}

              {variants.length > 0 && (
                <section className="space-y-1.5">
                  <p className="text-[14px] font-medium text-[#5b4a3c]">
                    Kích cỡ:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariantId(v.id)}
                        className={cn(
                          "rounded-full border px-4 py-1.5 text-[12px] font-medium transition-all duration-200",
                          selectedVariantId === v.id
                            ? "border-[#7a4a2a] bg-[#fff8f1] text-[#7a4a2a] shadow-[0_10px_24px_-18px_rgba(122,74,42,0.75)]"
                            : "border-[#d9cec2] bg-white text-[#1f1a16] hover:border-[#bda48f]",
                        )}
                      >
                        {getVariantName(v)}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section className="space-y-1.5">
                <p className="text-[14px] font-medium text-[#5b4a3c]">Đá:</p>
                <div className="flex flex-wrap gap-2">
                  {(["Ít", "Bình thường", "Nhiều"] as LevelOption[]).map(
                    (opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSelectedIce(opt)}
                        className={cn(
                          "rounded-full border px-4 py-1.5 text-[12px] font-medium transition-all duration-200",
                          selectedIce === opt
                            ? "border-[#7a4a2a] bg-[#fff8f1] text-[#7a4a2a] shadow-[0_10px_24px_-18px_rgba(122,74,42,0.75)]"
                            : "border-[#d9cec2] bg-white text-[#1f1a16] hover:border-[#bda48f]",
                        )}
                      >
                        {opt}
                      </button>
                    ),
                  )}
                </div>
              </section>

              <section className="space-y-1.5">
                <p className="text-[14px] font-medium text-[#5b4a3c]">
                  Topping:
                </p>

                {topLoading && (
                  <div className="text-[12px] text-[#85786d]">Đang tải...</div>
                )}
                {topError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-[12px] text-red-600">
                    {topError}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {toppings.map((t) => (
                    <div
                      key={t.id}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-all",
                        t.quantity > 0
                          ? "border-[#7a4a2a] bg-[#fff8f1] text-[#7a4a2a]"
                          : "border-[#d9cec2] bg-white text-[#1f1a16]",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => updateToppingQuantity(t.id, 1)}
                        className="inline-flex items-center gap-1 text-[12px]"
                      >
                        <span className="font-medium">{t.name}</span>
                        <span className="text-[10px] text-[#a68870]">
                          +{formatCurrency(t.price)}
                        </span>
                      </button>

                      {t.quantity > 0 && (
                        <>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-semibold text-[#7a4a2a]">
                            x{t.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateToppingQuantity(t.id, -1)}
                            className="flex h-4.5 w-4.5 items-center justify-center rounded-full border border-[#dac2af] bg-white text-[#7a4a2a] transition-colors hover:bg-[#faf2eb]"
                            aria-label={`Giảm ${t.name}`}
                          >
                            <Minus className="h-2.5 w-2.5" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section className="flex flex-wrap items-center gap-3 pt-0.5">
                <p className="text-[14px] font-medium text-[#5b4a3c]">
                  Số lượng:
                </p>
                <div className="flex items-center gap-3.5">
                  <button
                    className="flex h-8.5 w-8.5 items-center justify-center rounded-full border border-[#d3d5db] bg-white text-[#8b8f97] transition-colors hover:border-[#bbbfc8] hover:text-[#5f6670]"
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Giảm số lượng"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="min-w-[18px] text-center text-[18px] font-medium text-[#1b1612]">
                    {quantity}
                  </span>
                  <button
                    className="flex h-8.5 w-8.5 items-center justify-center rounded-full border border-[#d3d5db] bg-white text-[#8b8f97] transition-colors hover:border-[#bbbfc8] hover:text-[#5f6670]"
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Tăng số lượng"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </section>

              <div className="border-t border-[#e8ddd2] pt-4.5">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    id="buy-now-btn"
                    type="button"
                    onClick={() => handleSubmitSelection({ buyNow: true })}
                    className="inline-flex h-10 w-full items-center justify-center rounded-full bg-[#7a4a2a] px-5 text-[12px] font-bold uppercase tracking-[0.02em] text-white transition-colors hover:bg-[#693916]"
                  >
                    Mua ngay
                  </button>
                  <button
                    id="add-to-cart-btn"
                    type="button"
                    onClick={(e) =>
                      handleSubmitSelection({ triggerEl: e.currentTarget })
                    }
                    className="inline-flex h-10 w-full items-center justify-center rounded-full border border-[#7a4a2a] bg-white px-5 text-[12px] font-bold uppercase tracking-[0.02em] text-[#7a4a2a] transition-colors hover:bg-[#fff8f1]"
                  >
                    Thêm vào giỏ hàng
                  </button>
                </div>

                {(selectedToppings.length > 0 || quantity > 1) && (
                  <p className="mt-1.5 text-[11px] text-[#85786d]">
                    Tổng thanh toán hiện tại: {formatCurrency(totalPrice)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Suggested Products */}
        <div className="py-8">
          <div className="text-center mb-6">
            <div className="inline-block mb-2">
              <span className="text-xs font-bold text-[#693916] uppercase tracking-[0.2em] bg-amber-100 px-4 py-1.5 rounded-full shadow-sm">
                Gợi ý cho bạn
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#693916]">
              Sản Phẩm Tương Tự
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => scrollLeft(bestSellerRef)}
              className="hidden md:flex bg-white shadow-lg rounded-full p-3 hover:bg-amber-50 hover:shadow-xl transition-all flex-shrink-0 transform hover:scale-110"
              type="button"
            >
              <ChevronLeft className="w-6 h-6 text-[#693916]" />
            </button>

            <div
              ref={bestSellerRef}
              className="flex flex-1 gap-6 pb-4 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {coffeeItems.map((it) => (
                <div
                  key={it.id}
                  className={cn(
                    "group shrink-0 w-[220px] sm:w-[240px] lg:w-[calc((100%-96px)/5)] overflow-hidden rounded-2xl border border-[#EDE2D7] bg-white min-h-[360px] flex flex-col",
                    "shadow-[0_18px_50px_-34px_rgba(0,0,0,0.45)] hover:shadow-[0_26px_70px_-40px_rgba(0,0,0,0.55)]",
                    "hover:-translate-y-1 transition-all duration-300",
                  )}
                >
                  <Link href={`/products/${it.id}`} className="block">
                    <div className="relative h-56 overflow-hidden bg-[#F7F1EA]">
                      <Image
                        src={it.image}
                        alt={it.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="260px"
                      />
                      {it.isBestSeller && (
                        <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#E23B2E] px-2.5 py-1 text-[11px] font-semibold text-white shadow-[0_10px_24px_-16px_rgba(0,0,0,0.65)]">
                          <Flame className="size-3" />
                          HOT
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col p-4">
                    <div className="text-[11px] font-semibold tracking-[0.22em] text-[#B36A2E] uppercase">
                      {it.categoryName || "Sản phẩm"}
                    </div>
                    <h3 className="mt-1 font-display font-semibold text-base text-[#3b2314] line-clamp-2">
                      {it.name}
                    </h3>

                    <div className="mt-auto flex items-end justify-between pt-3">
                      <span className="font-display text-lg font-bold text-[#7a4a2a]">
                        {formatCurrency(it.price)}
                      </span>
                      <Link
                        href={`/products/${it.id}`}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full",
                          "bg-[#7a4a2a] text-white",
                          "shadow-[0_16px_34px_-18px_rgba(0,0,0,0.65)]",
                          "transition-transform duration-200 hover:scale-110 active:scale-95",
                        )}
                        aria-label={`Đặt mua ${it.name}`}
                      >
                        <Plus className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => scrollRight(bestSellerRef)}
              className="hidden md:flex bg-white shadow-lg rounded-full p-3 hover:bg-amber-50 hover:shadow-xl transition-all flex-shrink-0 transform hover:scale-110"
              type="button"
            >
              <ChevronRight className="w-6 h-6 text-[#693916]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailProduct;

function extractIdFromSlug(slug?: string) {
  if (!slug) return null;
  const last = slug.split("-").pop();
  return last && /^\d+$/.test(last) ? last : null;
}
