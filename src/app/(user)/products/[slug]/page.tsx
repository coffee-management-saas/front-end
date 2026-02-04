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
    <div className="max-w-6xl mx-auto bg-white min-h-screen px-4 md:px-6">
      {/* Breadcrumb with Back Button */}
      <div className="pt-4 pb-2 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-medium">Quay lại trang sản phẩm</span>
        </button>
        <span className="text-xs text-gray-400">|</span>
        <div className="text-xs text-gray-500">
          Trang chủ / <span className="text-gray-800">Sản phẩm</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start pt-12">
        <div className="relative h-105 md:h-130 rounded-xl overflow-hidden">
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
            priority
          />
        </div>

        <div className="pt-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                {item.name} ({activeVariant ? getVariantName(activeVariant) : ""})
              </h2>
              <p className="text-xs text-gray-500 mt-1">SKU: {item.sku}</p>

              {item.description && (
                <p className="text-sm text-gray-600 mt-2">{item.description}</p>
              )}

              <p className="text-lg md:text-xl font-bold text-[#693916] mt-2">
                {formatPrice(totalPrice)}
              </p>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <button
                className="w-7 h-7 rounded bg-[#693916] text-white flex items-center justify-center"
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm w-6 text-center">{quantity}</span>
              <button
                className="w-7 h-7 rounded bg-[#693916] text-white flex items-center justify-center"
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-xs font-semibold text-gray-800 mb-2">
              Chọn kích cỡ
            </h3>
            <div className="flex items-center gap-3">
              {variants.length > 0 ? (
                variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariantId(v.id)}
                    className={[
                      "min-w-16 h-8 px-2 rounded border text-xs font-semibold",
                      selectedVariantId === v.id
                        ? "bg-[#693916] text-white border-[#693916]"
                        : "bg-white text-gray-700 border-gray-200",
                    ].join(" ")}
                  >
                    {getVariantName(v)}
                  </button>
                ))
              ) : (
                <div className="text-sm text-gray-500">Đang tải kích cỡ...</div>
              )}
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold text-[#693916] pt-5">Đá</Label>
            <div className="mt-2 grid grid-cols-3 gap-2 pt-2">
              {(["Ít", "Bình thường", "Nhiều"] as LevelOption[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSelectedIce(opt)}
                  className={`h-8 px-3 rounded-md border text-xs font-medium transition ${selectedIce === opt
                    ? "bg-[#693916] text-white border-[#693916]"
                    : "bg-gray-100 border-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <h3 className="text-xs font-semibold text-gray-800 mb-3">
              Chọn Topping
            </h3>

            <div className="space-y-3">
              {topLoading && (
                <div className="text-sm text-gray-500 mb-2">
                  Đang tải topping...
                </div>
              )}
              {topError && (
                <div className="text-sm text-red-600 mb-2">{topError}</div>
              )}

              {toppings.map((t) => (
                <div
                  key={t.id}
                  className="grid grid-cols-[1fr_auto] gap-4 items-center"
                >
                  <div>
                    <p className="text-xs text-gray-900">{t.name}</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {formatPrice(t.price)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateToppingQuantity(t.id, -1)}
                      disabled={t.quantity === 0}
                      className={[
                        "w-7 h-7 rounded border flex items-center justify-center",
                        t.quantity === 0
                          ? "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed"
                          : "bg-[#693916] text-white border-[#693916]",
                      ].join(" ")}
                      type="button"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <span className="w-5 text-center text-sm text-gray-800">
                      {t.quantity}
                    </span>

                    <button
                      onClick={() => updateToppingQuantity(t.id, 1)}
                      className="w-7 h-7 rounded border border-[#693916] bg-[#693916] text-white flex items-center justify-center"
                      type="button"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
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

                setQuantity(1);
              }}
              className="mt-5 w-full bg-[#693916] hover:bg-amber-900 text-white py-2.5 rounded-md font-semibold text-sm flex items-center justify-center gap-2"
              type="button"
            >
              <ShoppingCart className="w-4 h-4" />
              Đặt hàng : {formatPrice(totalPrice)}
            </button>
          </div>
        </div>
      </div>

      {/* SẢN PHẨM  GỢI Ý */}
      <div className="text-center mb-12 mt-6 pt-10">
        <h1 className="text-xl md:text-xl font-bold text-[#693916] mb-2">
          SẢN PHẨM GỢI Ý
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => scrollLeft(bestSellerRef)}
          className="hidden md:flex bg-white shadow-md rounded-full p-2 hover:bg-gray-100 transition flex-shrink-0"
          type="button"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>

        <div
          ref={bestSellerRef}
          className="flex flex-1 gap-4 pb-4 mb-8 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {coffeeItems.map((it) => (
            <div
              key={it.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 shrink-0 w-[80%] sm:w-[45%] md:w-[calc((100%-1rem*4)/5)]"
            >
              <Link href={`/products/${it.id}`} className="block">
                <div className="relative bg-gray-100 h-36 flex items-center justify-center">
                  <Image
                    src={it.image}
                    alt={it.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </Link>

              <div className="p-2">
                <h3 className="text-xs font-semibold text-gray-800 mb-1 h-8 leading-tight">
                  {it.name}
                </h3>
                <p className="text-base font-bold text-[#693916] mb-2">
                  {it.price.toLocaleString("vi-VN")} ₫
                </p>
                <button
                  className="w-full bg-[#693916] text-white font-semibold py-1 rounded-lg flex items-center justify-center gap-1 text-xs"
                  type="button"
                >
                  <ShoppingCart className="w-3 h-3" />
                  Đặt mua
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => scrollRight(bestSellerRef)}
          className="hidden md:flex bg-white shadow-md rounded-full p-2 hover:bg-gray-100 transition flex-shrink-0"
          type="button"
        >
          <ChevronRight className="w-6 h-6 text-gray-600" />
        </button>
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
