"use client";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Crown, Flame, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Promotion } from "@/types/promotion";
import { useRouter } from "next/navigation";
import { getProducts, getBestSellers } from "@/services/product.service";
import type { Product } from "@/types/product";
import { formatCurrency, canUseImage, FALLBACK_IMG } from "@/lib/utils";
import ChatbotWidget from "@/components/ChatbotWidget";
import { FloatingCartButton } from "@/components/floating-cart-button";

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

  const marqueeItems = useMemo(
    () => [
      "PHA CH\u1EBE CHUY\u00CAN NGHI\u1EC6P",
      "TH\u1EF0C \u0110\u01A0N M\u1EDAI M\u1ED6I TU\u1EA6N",
      "CH\u01AF\u01A0NG TR\u00CCNH TH\u00C0NH VI\u00CAN",
      "H\u1ED6 TR\u1EE2 GIAO H\u00C0NG",
    ],
    [],
  );

  const itemsForUI = useMemo(() => {
    return promotions.map((p) => ({
      id: p.promotionId,
      name: p.promotionName || p.promotionCode,
      code: p.promotionCode,
      image: p.imageUrl,
      status: p.status ?? p.promotionStatus,
    }));
  }, [promotions]);

  const productsForUI = Array.isArray(products) ? products : [];

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
                className={`h-2.5 w-2.5 rounded-full transition ${
                  i === active ? "bg-gray-800" : "bg-white/80"
                }`}
                aria-label={`Go to ${i + 1}`}
                type="button"
              />
            ))}
          </div>
        </div>
      </main>

      {/* Marquee under hero */}
      <section
        aria-label="Highlights"
        className="w-full bg-[#c1a695] border-y border-white/15"
      >
        <div className="mx-auto max-w-[1400px] px-3">
          <div className="homeMarquee py-3">
            <div className="homeMarqueeInner">
              {[...marqueeItems, ...marqueeItems].map((label, idx) => (
                <div key={`${idx}-${label}`} className="flex items-center">
                  <span className="mx-6 text-[#d7b46a] text-lg leading-none">
                    {"\u2022"}
                  </span>
                  <span className="whitespace-nowrap text-[12px] sm:text-[13px] font-semibold uppercase tracking-[0.28em] text-white/95">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <main className="container mx-auto px-2 py-4 pt-1">
        <div className="text-center mb-8 mt-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-semibold tracking-wide text-amber-800">
            <Crown className="h-4 w-4 " />
            ĐƯỢC YÊU THÍCH NHẤT
          </div>
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
            className="flex overflow-x-hidden gap-4 pb-4 mb-8"
          >
            {!productsLoading &&
              productsForUI.length === 0 &&
              !productsError && (
                <div className="text-gray-600">Chưa có sản phẩm.</div>
              )}

            {productsForUI.map((product) => {
              const slug = toProductSlug(product.name, product.id);
              return (
                <div
                  key={product.id}
                  className="group shrink-0 w-[240px] sm:w-[250px] lg:w-[260px] overflow-hidden rounded-[28px] border border-[#EDE2D7] bg-white shadow-[0_18px_50px_-34px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_-40px_rgba(0,0,0,0.55)] flex flex-col"
                >
                  <Link href={`/products/${slug}`} className="block">
                    <div className="relative h-56 bg-[#F7F1EA]">
                      <Image
                        src={
                          canUseImage(product.image)
                            ? product.image!
                            : FALLBACK_IMG
                        }
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="260px"
                      />

                      <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#E23B2E] px-2.5 py-1 text-[11px] font-semibold text-white shadow-[0_10px_24px_-16px_rgba(0,0,0,0.65)]">
                        <Flame className="size-3" />
                        HOT
                      </div>
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col px-5 pb-3 pt-3">
                    <div className="text-[11px] font-semibold tracking-[0.22em] text-[#B36A2E] uppercase">
                      BEST SELLER
                    </div>

                    <h3 className="mt-1 line-clamp-2 text-base font-semibold text-[#3b2314]">
                      {product.name}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#9E8B7C]">
                      {product.description ?? ""}
                    </p>

                    <div className="mt-auto flex items-end justify-between pt-2">
                      <span className="font-display text-lg font-bold text-[#7a4a2a]">
                        {product.price
                          ? formatCurrency(product.price)
                          : "Giá cập nhật"}
                      </span>
                      <Link
                        href={`/products/${slug}`}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7a4a2a] text-white shadow-[0_16px_34px_-18px_rgba(0,0,0,0.65)] transition-transform duration-200 hover:scale-110 active:scale-95"
                        aria-label={`Mua ${product.name}`}
                      >
                        <Plus className="h-5 w-5" />
                      </Link>
                    </div>
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
                className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex-shrink-0 w-60 sm:w-64 lg:w-[240px] flex flex-col min-h-[400px]"
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

                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-base font-semibold text-gray-800 mb-1 line-clamp-2">
                    {item.name}
                  </h3>

                  <p className="text-sm text-orange-600 font-semibold mb-4 truncate">
                    MA CODE: {item.code}
                  </p>

                  <button
                    onClick={() => handleViewPromotion(item.id, item.name)}
                    className="mt-auto w-full bg-[#8b4f22] hover:bg-[#9a5b2a] text-white font-semibold py-2 rounded-full transition-colors duration-300 flex items-center justify-center gap-2 text-sm"
                  >
                    Xem ngay
                  </button>
                </div>
              </div>
            ))}
          </div>
          <ChatbotWidget />
          <FloatingCartButton />

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

      <style jsx>{`
        .homeMarquee {
          overflow: hidden;
          position: relative;
        }

        .homeMarqueeInner {
          display: flex;
          width: max-content;
          will-change: transform;
          animation: homeMarqueeScroll 22s linear infinite;
        }

        @keyframes homeMarqueeScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .homeMarquee {
            overflow-x: auto;
          }
          .homeMarqueeInner {
            animation: none;
          }
        }
      `}</style>
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
