"use client";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Promotion } from "@/types/promotion";
import { useRouter } from "next/navigation";
import { getProducts } from "@/services/product.service";
import type { Product } from "@/types/product";

const canUseImage = (url: string | undefined | null) => {
  if (!url) return false;
  return /^https?:\/\//.test(url) || url.startsWith("/");
};

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=1200&q=80";

const Homepage: React.FC = () => {
  const bestSellerRef = useRef<HTMLDivElement>(null);
  const newsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Promotions state
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promoLoading, setPromoLoading] = useState<boolean>(true);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Banner state
  const [active, setActive] = useState(0);
  const [perView, setPerView] = useState(1);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        setProductsError(null);

        const result = await getProducts({
          page: 0,
          size: 10,
          status: "ACTIVE",
        });

        setProducts(result.data);
      } catch (e) {
        setProductsError(e instanceof Error ? e.message : "Load products failed");
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Fetch promotions
  useEffect(() => {
    const controller = new AbortController();

    const fetchPromotions = async () => {
      try {
        setPromoLoading(true);
        setPromoError(null);

        const res = await fetch("/api/promotions", {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });

        const text = await res.text();
        const payload: unknown = text ? JSON.parse(text) : null;

        if (!res.ok) {
          const msg =
            typeof payload === "object" &&
              payload !== null &&
              "message" in payload
              ? String((payload as { message: unknown }).message)
              : `Fetch promotions failed (status ${res.status})`;
          throw new Error(msg);
        }

        if (!Array.isArray(payload)) {
          throw new Error(
            "Dữ liệu promotions không đúng format (expected array).",
          );
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

  const handleViewPromotion = (id: number, name: string) => {
    const slug = toPromotionSlug(name, id);
    router.push(`/promotions/${slug}`);
  };

  useEffect(() => {
    const calc = () => {
      if (window.innerWidth >= 1024) setPerView(3);
      else if (window.innerWidth >= 640) setPerView(2);
      else setPerView(1);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  // Banner auto-scroll
  const bannerImages = [
    "https://s3-hcmc02.higiocloud.vn/images/2026/01/ly_giay_tet_websitecover_2560x768-20260113032405.jpg",
    "https://i.pinimg.com/1200x/29/22/14/292214e4e318c2b8a245191da9c1e2f9.jpg",
    "https://i.pinimg.com/1200x/dd/70/0f/dd700f4d71d9f001992ca382f49ac02c.jpg",
  ];

  useEffect(() => {
    if (bannerImages.length <= 1) return;
    const t = setInterval(() => {
      setActive((prev) => (prev + 1) % bannerImages.length);
    }, 3000);
    return () => clearInterval(t);
  }, [bannerImages.length]);

  const itemsForUI = useMemo(() => {
    return promotions.map((p) => ({
      id: p.promotionId,
      name: p.promotionName || p.promotionCode,
      code: p.promotionCode,
      image: p.imageUrl,
      status: p.status ?? p.promotionStatus,
    }));
  }, [promotions]);

  const scrollLeft = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-7">
      {/* Banner Section */}
      <main className="w-full pt-7">
        <div className="relative w-full">
          <div className="relative w-full overflow-hidden">
            <div className="relative w-full h-45 sm:h-60 md:h-80 lg:h-100">
              <Image
                src={bannerImages[active] || FALLBACK_IMG}
                alt="banner"
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
            </div>
          </div>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {bannerImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`h-2.5 w-2.5 rounded-full transition ${i === active ? "bg-gray-800" : "bg-white/80"
                  }`}
                aria-label={`Go to ${i + 1}`}
                type="button"
              />
            ))}
          </div>
        </div>
      </main>

      {/* Products Section */}
      <main className="container mx-auto px-2 py-4 pt-1">
        <div className="text-center mb-12 mt-6">
          <h1 className="text-2xl md:text-2xl font-bold text-amber-700 mb-2">
            BEST SELLERS - TRÀ SỮA ĐẬM VỊ
          </h1>

          {productsError && (
            <p className="text-red-600 mt-2">{productsError}</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => scrollLeft(bestSellerRef)}
            className="bg-white shadow-md rounded-full p-2 hover:bg-gray-100 transition-colors duration-300 flex-shrink-0"
            disabled={productsLoading}
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          <div
            ref={bestSellerRef}
            className="flex overflow-x-hidden gap-4 pb-4 mb-8 flex-1"
          >
            {!productsLoading && products.length === 0 && !productsError && (
              <div className="text-gray-600">Chưa có sản phẩm.</div>
            )}

            {products.map((product) => {
              const slug = toProductSlug(product.name, product.id);
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 shrink-0 w-48"
                >
                  <Link href={`/products/${slug}`} className="block">
                    <div className="relative bg-gray-100 h-32 flex items-center justify-center">
                      <Image
                        src={product.image || FALLBACK_IMG}
                        alt={product.name}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                  </Link>

                  <div className="p-2">
                    <h3 className="text-xs font-semibold text-gray-800 mb-1 h-8 text-xs leading-tight">
                      {product.name}
                    </h3>
                    <p className="text-base font-bold text-amber-700 mb-2">
                      59,000 ₫
                    </p>

                    <Link
                      href={`/products/${slug}`}
                      className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-1 rounded-lg transition-colors duration-300 flex items-center justify-center gap-1 text-xs"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      Mua hàng
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => scrollRight(bestSellerRef)}
            className="bg-white shadow-md rounded-full p-2 hover:bg-gray-100 transition-colors duration-300 flex-shrink-0"
            disabled={productsLoading}
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </main>

      {/* Promotions Section */}
      <main className="container mx-auto px-2 py-4 pt-1">
        <div className="text-center mb-12 mt-6">
          <h1 className="text-2xl md:text-2xl font-bold text-amber-700 mb-2">
            TIN TỨC & KHUYẾN MÃI
          </h1>


          {promoError && <p className="text-red-600 mt-2">{promoError}</p>}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => scrollLeft(newsRef)}
            className="bg-white shadow-md rounded-full p-2 hover:bg-gray-100 transition-colors duration-300 flex-shrink-0"
            disabled={promoLoading}
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          <div
            ref={newsRef}
            className="flex overflow-x-hidden gap-4 pb-4 mb-8 flex-1"
          >
            {!promoLoading && itemsForUI.length === 0 && !promoError && (
              <div className="text-gray-600">Chưa có khuyến mãi.</div>
            )}

            {itemsForUI.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex-shrink-0 w-48"
              >
                <div className="relative bg-gray-100 h-32 flex items-center justify-center">
                  {canUseImage(item.image) ? (
                    <Image
                      src={item.image as string}
                      alt={item.name}
                      fill
                      className="object-cover rounded-lg"
                      sizes="192px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[11px] text-gray-500">
                      Không có hình ảnh
                    </div>
                  )}
                </div>

                <div className="p-2">
                  <h3 className="text-xs font-semibold text-gray-800 mb-1 h-5 leading-tight line-clamp-2">
                    {item.name}
                  </h3>

                  <p className="text-[11px] text-gray-600 mb-2 truncate">
                    MÃ CODE: {item.code}
                  </p>

                  <button
                    onClick={() => handleViewPromotion(item.id, item.name)}
                    className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-1 rounded-lg transition-colors duration-300 flex items-center justify-center gap-1 text-xs"
                  >
                    Xem ngay
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => scrollRight(newsRef)}
            className="bg-white shadow-md rounded-full p-2 hover:bg-gray-100 transition-colors duration-300 flex-shrink-0"
            disabled={promoLoading}
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </main>
    </div>
  );
};

export default Homepage;

function toPromotionSlug(name: string, id: number) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  return `${base || "khuyen-mai"}-${id}`;
}

function toProductSlug(name: string, id: number) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  return `${base || "san-pham"}-${id}`;
}
