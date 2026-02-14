"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Minus,
  Plus,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import type { ApiEnvelope, Product, ProductVariant, Size } from "@/types/product";
import { ToppingsResponse } from "@/types/topping";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { getProductVariants, getProductSizes } from "@/services/product.service";
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

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=1200&q=80";

const getVariantName = (v: ProductVariant) => {
  if (typeof v.size === 'string') return v.size;
  if (v.size && typeof v.size === 'object' && 'code' in v.size) return (v.size as any).code;
  if (v.size && typeof v.size === 'object' && 'name' in v.size) return (v.size as any).name;
  return v.sizeCode || v.code || v.name || `Size ${v.id}`;
};

const DetailProduct: React.FC = () => {
  const params = useParams<{ slug: string }>();
  const productId = useMemo(
    () => extractIdFromSlug(params?.slug),
    [params?.slug],
  );

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const bestSellerRef = useRef<HTMLDivElement>(null);
  const [selectedIce, setSelectedIce] = useState<LevelOption>("Nhiều");
  const [quantity, setQuantity] = useState<number>(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
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
          getProductSizes().catch(() => ({ data: [] }))
        ]);

        const productPayload = (await productRes.json()) as ApiEnvelope<Product> | { message?: string };
        if (!productRes.ok || ("code" in productPayload && productPayload.code !== 200)) {
          throw new Error(("message" in productPayload && productPayload.message) || "Load product failed");
        }
        if ("data" in productPayload) {
          setProduct(productPayload.data as Product);
        }

        const variantsData = (variantsRes as ApiEnvelope<ProductVariant[]>).data || [];
        const sizesData = (sizesRes as ApiEnvelope<Size[]>).data || [];
        setSizes(sizesData);

        const sizeOrder: Record<string, number> = {};
        sizesData.forEach((s, idx) => {
          sizeOrder[s.code] = idx + 1;
          sizeOrder[s.name] = idx + 1;
        });

        // Fallback if no sizes loaded
        if (Object.keys(sizeOrder).length === 0) {
          Object.assign(sizeOrder, { "S": 1, "M": 2, "L": 3, "XL": 4 });
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
          .filter((p) => p.id !== product.id)
          .map((p) => ({
            id: p.id,
            name: p.name,
            price: 59000,
            image: p.image ?? FALLBACK_IMG,
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

  const item = useMemo(() => {
    return {
      name: product?.name ?? "Đang tải...",
      image: product?.image ?? FALLBACK_IMG,
      sku: product?.id ?? 0,
      categoryName: product?.categoryName ?? "",
      description: product?.description ?? "",
    };
  }, [product]);




  const activeVariant = useMemo(() => {
    return variants.find(v => v.id === selectedVariantId);
  }, [variants, selectedVariantId]);

  // Use price from variant; fallback to 0 if not found
  const productPrice = activeVariant ? activeVariant.price : 0;

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

  const formatPrice = (price: number) => price.toLocaleString("vi-VN") + " ₫";

  if (loading) return null;
  if (error) return <div className="p-6 pt-24 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F7F5] to-white">
      <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Breadcrumb with Back Button */}
        <div className="pt-6 pb-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-[#693916] transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-white shadow-sm group-hover:shadow-md flex items-center justify-center transition-all">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Quay lại</span>
          </button>
          <span className="text-gray-300">|</span>
          <div className="text-sm text-gray-500">
            Trang chủ / <span className="text-[#693916] font-medium">Chi tiết sản phẩm</span>
          </div>
        </div>

        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-4">
          {/* Product Image - takes 5 cols */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-24">
              <div className="relative h-[250px] md:h-[350px] lg:h-[380px] rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-amber-50 to-orange-50">
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
          <div className="lg:col-span-7 space-y-3">
            {/* Product Header */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <span className="inline-block px-2 py-0.5 bg-amber-100 text-[#693916] text-[10px] font-bold rounded-full mb-1">
                    {item.categoryName || "Đồ uống"}
                  </span>
                  <h1 className="text-lg md:text-xl font-bold text-gray-900 mb-1 leading-tight">
                    {item.name}
                  </h1>
                  <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                </div>

                {/* Quantity Selector */}
                <div className="flex items-center gap-2 bg-amber-50 rounded-lg p-1">
                  <button
                    className="w-7 h-7 rounded-md bg-white shadow-sm hover:shadow-md text-[#693916] flex items-center justify-center transition-all hover:scale-105"
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-bold text-[#693916] min-w-[20px] text-center">
                    {quantity}
                  </span>
                  <button
                    className="w-7 h-7 rounded-md bg-white shadow-sm hover:shadow-md text-[#693916] flex items-center justify-center transition-all hover:scale-105"
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {item.description && (
                <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                  {item.description}
                </p>
              )}

              {/* Price Display */}
              {/* Total Price Removed as per feedback */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Size Selection */}
              <div className="bg-white rounded-xl p-3 shadow-sm border border-amber-100">
                <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#693916] rounded-md flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">S</span>
                  </div>
                  Chọn kích cỡ
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {variants.length > 0 ? (
                    variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariantId(v.id)}
                        className={[
                          "h-9 rounded-lg font-bold text-xs transition-all duration-300 transform hover:scale-105",
                          selectedVariantId === v.id
                            ? "bg-gradient-to-br from-[#693916] to-[#876F60] text-white shadow-md scale-105"
                            : "bg-gray-50 text-gray-700 border border-gray-200 hover:border-amber-300",
                        ].join(" ")}
                      >
                        {getVariantName(v)}
                      </button>
                    ))
                  ) : (
                    <div className="col-span-4 text-xs text-gray-500 text-center py-2">
                      Đang tải...
                    </div>
                  )}
                </div>
              </div>

              {/* Ice Level */}
              <div className="bg-white rounded-xl p-3 shadow-sm border border-amber-100">
                <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#693916] rounded-md flex items-center justify-center">
                    <span className="text-white text-[10px]">❄️</span>
                  </div>
                  Đá
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {(["Ít", "Bình thường", "Nhiều"] as LevelOption[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSelectedIce(opt)}
                      className={`h-9 rounded-lg font-semibold text-[10px] transition-all duration-300 ${selectedIce === opt
                        ? "bg-gradient-to-br from-[#693916] to-[#876F60] text-white shadow-md scale-105"
                        : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-[#693916]"
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Toppings */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-amber-100">
              <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                <div className="w-5 h-5 bg-[#693916] rounded-md flex items-center justify-center">
                  <Plus className="w-3 h-3 text-white" />
                </div>
                Topping
              </h3>

              {topLoading && (
                <div className="text-xs text-gray-500 text-center py-2">
                  Đang tải...
                </div>
              )}
              {topError && (
                <div className="text-xs text-red-600 bg-red-50 rounded-md p-2 mb-2">
                  {topError}
                </div>
              )}

              <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                {toppings.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 bg-gradient-to-r from-gray-50 to-amber-50 rounded-lg border border-gray-200 hover:border-amber-300 transition-all"
                  >
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-900">{t.name}</p>
                      <p className="text-[10px] text-amber-600 font-medium mt-0">
                        +{formatPrice(t.price)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateToppingQuantity(t.id, -1)}
                        disabled={t.quantity === 0}
                        className={[
                          "w-6 h-6 rounded-md flex items-center justify-center transition-all",
                          t.quantity === 0
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-white shadow-sm hover:shadow-md text-[#693916] hover:scale-105",
                        ].join(" ")}
                        type="button"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <span className="w-5 text-center text-xs font-bold text-gray-800">
                        {t.quantity}
                      </span>

                      <button
                        onClick={() => updateToppingQuantity(t.id, 1)}
                        className="w-6 h-6 rounded-md bg-white shadow-sm hover:shadow-md text-[#693916] flex items-center justify-center transition-all hover:scale-105"
                        type="button"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              id="add-to-cart-btn"
              onClick={(e) => {
                if (!product) return;

                if (!activeVariant) {
                  toast.error("Vui lòng chọn kích cỡ");
                  return;
                }

                addItem({
                  productId: product.id,
                  productName: product.name,
                  productImage: product.image ?? FALLBACK_IMG,
                  variantId: activeVariant.id,
                  size: getVariantName(activeVariant),
                  basePrice: productPrice,
                  quantity,
                  toppings: toppings
                    .filter((t) => t.quantity > 0)
                    .map((t) => ({
                      id: Number(t.id),
                      name: t.name,
                      price: t.price,
                      quantity: t.quantity,
                    })),
                  iceLevel: selectedIce,
                });

                // Trigger flying animation
                triggerFlyToCart(
                  product.image ?? FALLBACK_IMG,
                  e.currentTarget
                );

                toast.success("Đã thêm vào giỏ hàng!");
                setQuantity(1);
              }}
              className="w-full bg-gradient-to-r from-[#693916] to-[#876F60] hover:from-[#876F60] hover:to-[#693916] text-white py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              type="button"
            >
              <ShoppingCart className="w-6 h-6" />
              Thêm vào giỏ hàng - {formatPrice(totalPrice)}
            </button>
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
                  className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 shrink-0 w-[200px] overflow-hidden border border-amber-100 transform hover:-translate-y-2"
                >
                  <Link href={`/products/${it.id}`} className="block">
                    <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 h-40 overflow-hidden">
                      <Image
                        src={it.image}
                        alt={it.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  </Link>

                  <div className="p-5">
                    <h3 className="text-base font-bold text-gray-800 mb-2 h-12 line-clamp-2 leading-tight group-hover:text-[#693916] transition-colors">
                      {it.name}
                    </h3>
                    <p className="text-xl font-bold text-[#693916] mb-4">
                      {it.price.toLocaleString("vi-VN")} ₫
                    </p>
                    <button
                      className="w-full bg-gradient-to-r from-[#693916] to-[#876F60] hover:from-[#876F60] hover:to-[#693916] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                      type="button"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Đặt mua
                    </button>
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
