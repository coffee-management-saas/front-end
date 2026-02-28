"use client";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Promotion } from "@/types/promotion";
import { useRouter } from "next/navigation";
import { getProducts, getBestSellers } from "@/services/product.service";
import type { Product } from "@/types/product";
import { formatCurrency, canUseImage, FALLBACK_IMG } from "@/lib/utils";


const Homepage: React.FC = () => {
  const bestSellerRef = useRef<HTMLDivElement>(null);
  const newsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Promotions state
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promoLoading, setPromoLoading] = useState<boolean>(true);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Products state (Best Sellers)
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Banner state
  const [active, setActive] = useState(0);
  const [perView, setPerView] = useState(1);

  // Fetch best sellers from API
  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        setProductsLoading(true);
        setProductsError(null);

        const result = await getBestSellers(10);

        setProducts(result);
      } catch (e) {
        setProductsError(
          e instanceof Error ? e.message : "Load best sellers failed",
        );
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchBestSellers();
  }, []);

  // Fetch promotions
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
    "https://s3-hcmc02.higiocloud.vn/phuclong/2026/01/lcd_focussp_kv-ta%CC%81ch-2--20260112125129.jpg",
    "https://s3-hcmc02.higiocloud.vn/phuclong/2026/01/lcd_combo1-standard-20260112125155.jpg",
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
                unoptimized
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
        <div className="text-center mb-8 mt-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-[0.12em] text-[#6a3715]">
            BEST SELLERS - TRÀ SỮA ĐẬM VỊ
          </h1>
          {productsLoading && (
            <p className="text-gray-600 mt-2">Đang tải sản phẩm...</p>
          )}
          {productsError && (
            <p className="text-red-600 mt-2">{productsError}</p>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => scrollLeft(bestSellerRef)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 transition-colors duration-300 text-gray-700 hover:text-[#7a4a2a] bg-white/70 hover:bg-white/90 backdrop-blur-sm"
            disabled={productsLoading}
            aria-label="Previous"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>

          <div
            ref={bestSellerRef}
            className="flex overflow-x-hidden gap-3 lg:gap-4 pb-4 mb-8"
          >
            {!productsLoading && products.length === 0 && !productsError && (
              <div className="text-gray-600">Chưa có sản phẩm.</div>
            )}

            {products.map((product) => {
              const slug = toProductSlug(product.name, product.id);
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 shrink-0 w-60 sm:w-64 lg:w-[240px]"
                >
                  <Link href={`/products/${slug}`} className="block">
                    <div className="relative bg-gray-100 h-60 flex items-center justify-center">
                      <Image
                        src={canUseImage(product.image) ? product.image! : FALLBACK_IMG}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </Link>

                  <div className="p-4">
                    <h3 className="text-base font-semibold text-gray-800 mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-orange-600 font-semibold mb-4">
                      {product.price ? formatCurrency(product.price) : "Giá cập nhật"}
                    </p>

                    <Link
                      href={`/products/${slug}`}
                      className="w-full bg-[#8b4f22] hover:bg-[#9a5b2a] text-white font-semibold py-2 rounded-full transition-colors duration-300 flex items-center justify-center gap-2 text-sm"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Mua hàng
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => scrollRight(bestSellerRef)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 transition-colors duration-300 text-gray-700 hover:text-[#7a4a2a] bg-white/70 hover:bg-white/90 backdrop-blur-sm"
            disabled={productsLoading}
            aria-label="Next"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        </div>
      </main>

      {/* Promotions Section */}
      <main className="container mx-auto px-2 py-4 pt-1">
        <div className="text-center mb-8 mt-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-[0.12em] text-[#6a3715]">
            TIN TỨC & KHUYẾN MÃI
          </h1>

          {promoLoading && (
            <p className="text-gray-600 mt-2">Đang tải khuyến mãi...</p>
          )}
          {promoError && <p className="text-red-600 mt-2">{promoError}</p>}
        </div>

        <div className="relative">
          <button
            onClick={() => scrollLeft(newsRef)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 transition-colors duration-300 text-gray-700 hover:text-[#7a4a2a] bg-white/70 hover:bg-white/90 backdrop-blur-sm"
            disabled={promoLoading}
            aria-label="Previous"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>

          <div ref={newsRef} className="flex overflow-x-hidden gap-4 pb-4 mb-8">
            {!promoLoading && itemsForUI.length === 0 && !promoError && (
              <div className="text-gray-600">Chưa có khuyến mãi.</div>
            )}

            {itemsForUI.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex-shrink-0 w-60 sm:w-64 lg:w-[240px]"
              >
                <div className="relative bg-gray-100 h-60 flex items-center justify-center">
                  {canUseImage(item.image) ? (
                    <Image
                      src={item.image as string}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="240px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[11px] text-gray-500">
                      Không có hình ảnh
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="text-base font-semibold text-gray-800 mb-1 line-clamp-2">
                    {item.name}
                  </h3>

                  <p className="text-sm text-orange-600 font-semibold mb-4 truncate">
                    MA CODE: {item.code}
                  </p>

                  <button
                    onClick={() => handleViewPromotion(item.id, item.name)}
                    className="w-full bg-[#8b4f22] hover:bg-[#9a5b2a] text-white font-semibold py-2 rounded-full transition-colors duration-300 flex items-center justify-center gap-2 text-sm"
                  >
                    Xem ngay
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => scrollRight(newsRef)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 transition-colors duration-300 text-gray-700 hover:text-[#7a4a2a] bg-white/70 hover:bg-white/90 backdrop-blur-sm"
            disabled={promoLoading}
            aria-label="Next"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        </div>
      </main>
    </div>
  );
};

export default Homepage;

function toPromotionSlug(name: string, id: number) {
  const base = (name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  return `${base || "khuyen-mai"}-${id}`;
}

function toProductSlug(name: string, id: number) {
  const base = (name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  return `${base || "san-pham"}-${id}`;
}
