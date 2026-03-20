"use client";
import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coffee,
  Crown,
  Flame,
  Gift,
  Leaf,
  Plus,
  ShieldCheck,
  Sparkles,
  Truck,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Promotion } from "@/types/promotion";
import { useRouter } from "next/navigation";
import { getBestSellers, getProducts } from "@/services/product.service";
import type { Product } from "@/types/product";
import { formatCurrency, canUseImage, FALLBACK_IMG } from "@/lib/utils";
import ChatbotWidget from "@/components/ChatbotWidget";
import { FloatingCartButton } from "@/components/floating-cart-button";

type ShowcaseItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const showcaseItemsLeft: ShowcaseItem[] = [
  {
    icon: Sparkles,
    title: "Vừa ra mắt trên menu",
    description:
      "Phiên bản mới được giới thiệu dành cho khách muốn thử một lựa chọn nổi bật và khác biệt ngay từ lần đầu.",
  },
  {
    icon: Leaf,
    title: "Hương vị mới dễ tiếp cận",
    description:
      "Công thức được cân bằng để vẫn tươi mới, dễ uống và phù hợp cho cả khách quen lẫn khách thử lần đầu.",
  },
  {
    icon: ShieldCheck,
    title: "Công thức đã hoàn thiện",
    description:
      "Tỷ lệ nguyên liệu được thử nghiệm kỹ để sản phẩm mới ra mắt vẫn giữ trải nghiệm ổn định ở mỗi lần gọi.",
  },
];

const showcaseItemsRight: ShowcaseItem[] = [
  {
    icon: Clock3,
    title: "Pha chế ngay khi gọi",
    description:
      "Mỗi ly được hoàn thiện tại quầy để giữ độ tươi, mùi hương và cảm giác ngon nhất khi thưởng thức.",
  },
  {
    icon: Truck,
    title: "Phù hợp cả mang đi",
    description:
      "Cấu trúc sản phẩm được tối ưu để vẫn đẹp mắt và giữ vị tốt khi khách mua mang đi hoặc đặt giao hàng.",
  },
  {
    icon: Gift,
    title: "Sẵn sàng cho ưu đãi ra mắt",
    description:
      "Dễ kết hợp với các chương trình giới thiệu sản phẩm mới để thu hút khách trải nghiệm ngay trong giai đoạn đầu.",
  },
];

const FEATURED_PRODUCT_NAME = "Sinh t\u1ed1 L\u1ee5c Xu\u00e2n";
const FEATURED_PRODUCT_DESCRIPTION =
  "S\u1ea3n ph\u1ea9m m\u1edbi v\u1eeba ra m\u1eaft v\u1edbi h\u01b0\u01a1ng v\u1ecb t\u01b0\u01a1i s\u00e1ng, d\u1ec5 u\u1ed1ng v\u00e0 \u0111\u01b0\u1ee3c ho\u00e0n thi\u1ec7n \u0111\u1ec3 t\u1ea1o \u1ea5n t\u01b0\u1ee3ng ngay t\u1eeb l\u1ea7n th\u1eed \u0111\u1ea7u ti\u00ean.";
const FEATURED_PRODUCT_KEY = normalizeProductLookup(FEATURED_PRODUCT_NAME);

const Homepage: React.FC = () => {
  const bestSellerRef = useRef<HTMLDivElement>(null);
  const showcaseRef = useRef<HTMLElement>(null);
  const router = useRouter();

  // Promotions state
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promoLoading, setPromoLoading] = useState<boolean>(true);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Products state (Best Sellers)
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [featuredProductOverride, setFeaturedProductOverride] =
    useState<Product | null>(null);

  // Banner state
  const [active, setActive] = useState(0);
  const [activeShowcaseSlide, setActiveShowcaseSlide] = useState(0);
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

  useEffect(() => {
    const fetchFeaturedProduct = async () => {
      try {
        const result = await getProducts({
          page: 0,
          size: 100,
          status: "ACTIVE",
        });

        const match =
          result.data.find((product) =>
            normalizeProductLookup(product.name).includes(FEATURED_PRODUCT_KEY),
          ) ?? null;

        setFeaturedProductOverride(match);
      } catch {
        setFeaturedProductOverride(null);
      }
    };

    fetchFeaturedProduct();
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
    "https://phela.vn/wp-content/uploads/2025/08/Resize-Digital_Cover-Fb-scaled.jpg",
    "https://s3-hcmc02.higiocloud.vn/phuclong/2026/01/lcd_combo1-standard-20260112125155.jpg",
  ];

  useEffect(() => {
    if (bannerImages.length <= 1) return;
    const t = setInterval(() => {
      setActive((prev) => (prev + 1) % bannerImages.length);
    }, 3000);
    return () => clearInterval(t);
  }, [bannerImages.length]);

  useEffect(() => {
    const section = showcaseRef.current;

    if (!section) return;

    const revealItems = Array.from(
      section.querySelectorAll<HTMLElement>("[data-showcase-reveal]"),
    );

    if (revealItems.length === 0) return;

    if (
      typeof window === "undefined" ||
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      revealItems.forEach((item) => item.setAttribute("data-visible", "true"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.setAttribute("data-visible", "true");
          currentObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.28,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    revealItems.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

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
      startDate: p.startDate,
      endDate: p.endDate,
    }));
  }, [promotions]);
  const homepagePromotions = itemsForUI.slice(0, 8);

  const productsForUI = Array.isArray(products) ? products : [];
  const featuredProduct =
    featuredProductOverride ??
    productsForUI.find((product) =>
      normalizeProductLookup(product.name).includes(FEATURED_PRODUCT_KEY),
    ) ??
    null;
  const featuredProductName = featuredProduct?.name ?? FEATURED_PRODUCT_NAME;
  const featuredProductHref = featuredProduct
    ? `/products/${toProductSlug(featuredProduct.name, featuredProduct.id)}`
    : "/menu";
  const featuredProductDescription =
    featuredProduct?.description?.trim() || FEATURED_PRODUCT_DESCRIPTION;
  const featuredProductPrice = featuredProduct?.price
    ? formatCurrency(featuredProduct.price)
    : "Pha chế tại quầy";
  const showcaseSlides = useMemo(
    () => [
      {
        key: "featured-default",
        imageSrc: "/images/export-02-cutout-preview3.png",
        imageAlt: featuredProductName,
        eyebrow: "Má»›i ra máº¯t",
        title: featuredProductName,
        description: featuredProductDescription,
        badge: featuredProductPrice,
        href: featuredProductHref,
        ctaLabel: featuredProduct ? "KhÃ¡m phÃ¡ ngay" : "Xem menu má»›i",
        panelClassName:
          "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.88),rgba(255,255,255,0.72)_44%,rgba(241,224,207,0.66)_100%)]",
        imageWrapClassName: "max-w-[500px]",
        imageClassName: "scale-100",
      },
      {
        key: "featured-hero",
        imageSrc: "/images/export-01-cutout.png",
        imageAlt: featuredProductName,
        eyebrow: "Hero spotlight",
        title: featuredProductName,
        description: featuredProductDescription,
        badge: featuredProductPrice,
        href: featuredProductHref,
        ctaLabel: featuredProduct ? "KhÃ¡m phÃ¡ ngay" : "Xem menu má»›i",
        panelClassName:
          "bg-[radial-gradient(circle_at_top,rgba(255,248,239,0.96),rgba(248,232,214,0.88)_42%,rgba(231,205,181,0.74)_100%)]",
        imageWrapClassName: "max-w-[520px]",
        imageClassName: "scale-[1.03]",
      },
    ],
    [
      featuredProduct,
      featuredProductName,
      featuredProductDescription,
      featuredProductHref,
      featuredProductPrice,
    ],
  );
  const scrollAmount = perView >= 3 ? 320 : perView === 2 ? 260 : 220;

  useEffect(() => {
    if (showcaseSlides.length <= 1) return;

    const timer = setInterval(() => {
      setActiveShowcaseSlide((prev) => (prev + 1) % showcaseSlides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [showcaseSlides.length]);

  const scrollLeft = (
    ref: React.RefObject<HTMLDivElement | null>,
    amount = scrollAmount,
  ) => {
    if (ref.current) {
      ref.current.scrollBy({ left: -amount, behavior: "smooth" });
    }
  };

  const scrollRight = (
    ref: React.RefObject<HTMLDivElement | null>,
    amount = scrollAmount,
  ) => {
    if (ref.current) {
      ref.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner Section */}
      <main className="w-full">
        <div className="relative w-full">
          <div className="relative w-full overflow-hidden">
            <div className="relative h-44 w-full sm:h-72 md:h-[420px] lg:h-[520px]">
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
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5 sm:bottom-3 sm:gap-2">
            {bannerImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`h-2 w-2 rounded-full transition sm:h-2.5 sm:w-2.5 ${
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

      <section
        ref={showcaseRef}
        aria-label="Signature showcase"
        className="relative overflow-hidden bg-[linear-gradient(180deg,#f8efe5_0%,#fff9f4_48%,#ffffff_100%)] py-12 sm:py-16 lg:py-24"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#ead8c6]/80 to-transparent" />
        <div className="pointer-events-none absolute -left-16 top-20 h-64 w-64 rounded-full bg-[#b87646]/15 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-28 h-72 w-72 rounded-full bg-[#f2d5bb]/55 blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-white/80 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className="showcaseReveal showcaseRevealTop mx-auto mb-10 max-w-3xl text-center sm:mb-12 lg:mb-16"
            data-showcase-reveal
            data-visible="false"
            style={{ transitionDelay: "80ms" }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[#dec7b3] bg-white/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8a5a39] shadow-[0_12px_28px_-20px_rgba(76,41,18,0.55)] sm:px-4 sm:text-[11px] sm:tracking-[0.28em]">
              <Coffee className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Sản phẩm mới ra mắt
            </span>
            <h2 className="mt-4 text-[1.85rem] font-bold tracking-tight text-[#4d2d19] sm:mt-5 sm:text-4xl lg:text-5xl">
              Khám phá hương vị mới vừa có mặt tại Tea Cafe
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#7b6554] sm:mt-4 sm:text-base sm:leading-7 lg:text-lg">
              Một sản phẩm mới ra mắt dành cho khách muốn thử trải nghiệm khác
              biệt, tươi mới và dễ chọn ngay từ lần đầu.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12 lg:items-center lg:gap-8">
            <div
              className="showcaseReveal showcaseRevealLeft order-2 space-y-4 sm:space-y-5 lg:order-1 lg:col-span-4"
              data-showcase-reveal
              data-visible="false"
              style={{ transitionDelay: "140ms" }}
            >
              {showcaseItemsLeft.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-[24px] border border-white/80 bg-white/80 p-4 shadow-[0_24px_60px_-42px_rgba(70,35,12,0.6)] backdrop-blur-sm sm:rounded-[28px] sm:p-5"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f5e3d5] text-[#8a5a39] shadow-inner sm:h-14 sm:w-14">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold tracking-tight text-[#442615] sm:text-lg">
                        {title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-6 text-[#7b6554] sm:mt-2 sm:text-[15px] sm:leading-7">
                        {description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="showcaseReveal showcaseRevealTop order-1 lg:order-2 lg:col-span-4"
              data-showcase-reveal
              data-visible="false"
              style={{ transitionDelay: "220ms" }}
            >
              <div className="mx-auto flex w-full max-w-[540px] flex-col items-center">
                <div className="w-full overflow-hidden rounded-[28px] sm:rounded-[34px]">
                  <div className="relative mx-auto mt-2 w-full max-w-[300px] sm:mt-4 sm:max-w-[420px] lg:max-w-[500px]">
                    <Image
                      src="/images/export-02-cutout-preview3.png"
                      alt={featuredProductName}
                      width={1314}
                      height={1847}
                      className="animate-float h-auto w-full object-contain"
                      sizes="(max-width: 768px) 78vw, (max-width: 1280px) 36vw, 500px"
                    />
                  </div>

                  <div className="mt-4 text-center sm:mt-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#a17250] sm:text-[11px] sm:tracking-[0.3em]">
                      Mới ra mắt
                    </p>
                    <h3 className="mt-2 text-[1.65rem] font-bold tracking-tight text-[#442615] sm:text-[2rem]">
                      {featuredProductName}
                    </h3>
                    <p className="mt-2.5 text-sm leading-6 text-[#7b6554] sm:mt-3 sm:text-[15px] sm:leading-7">
                      {featuredProductDescription}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 sm:mt-6 sm:gap-3">
                      <span className="rounded-full border border-white/80 bg-white px-3.5 py-2 text-sm font-semibold text-[#6f3d20] shadow-[0_18px_36px_-26px_rgba(64,34,13,0.68)] sm:px-4">
                        {featuredProductPrice}
                      </span>
                      <Link
                        href={featuredProductHref}
                        className="rounded-full bg-[#6f3d20] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_22px_40px_-28px_rgba(64,34,13,0.82)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#824928] sm:px-5"
                      >
                        {featuredProduct ? "Khám phá ngay" : "Xem menu mới"}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="showcaseReveal showcaseRevealRight order-3 space-y-4 sm:space-y-5 lg:col-span-4"
              data-showcase-reveal
              data-visible="false"
              style={{ transitionDelay: "300ms" }}
            >
              {showcaseItemsRight.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-[24px] border border-white/80 bg-white/80 p-4 shadow-[0_24px_60px_-42px_rgba(70,35,12,0.6)] backdrop-blur-sm sm:rounded-[28px] sm:p-5"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f5e3d5] text-[#8a5a39] shadow-inner sm:h-14 sm:w-14">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold tracking-tight text-[#442615] sm:text-lg">
                        {title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-6 text-[#7b6554] sm:mt-2 sm:text-[15px] sm:leading-7">
                        {description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <main className="mx-auto w-full max-w-7xl px-3 py-4 pt-1 sm:px-4 lg:px-6">
        <div className="mb-7 mt-5 text-center sm:mb-8 sm:mt-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-semibold tracking-wide text-amber-800">
            <Crown className="h-4 w-4 " />
            ĐƯỢC YÊU THÍCH NHẤT
          </div>
          <h1 className="mt-3 text-[1.55rem] font-bold tracking-[0.08em] text-[#6a3715] sm:text-2xl sm:tracking-[0.1em] md:text-3xl md:tracking-[0.12em]">
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
            className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/70 p-2 text-gray-700 backdrop-blur-sm transition-colors duration-300 hover:bg-white/90 hover:text-[#7a4a2a] md:flex"
            disabled={productsLoading}
            aria-label="Previous"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>

          <div
            ref={bestSellerRef}
            className="hideScrollbar -mx-3 mb-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-4 sm:mx-0 sm:gap-4 sm:px-0 md:overflow-x-hidden"
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
                  className="group flex w-[76vw] max-w-[220px] shrink-0 snap-start flex-col overflow-hidden border border-[#EDE2D7] bg-white shadow-[0_18px_50px_-34px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_-40px_rgba(0,0,0,0.55)] sm:w-[250px] sm:max-w-none lg:w-[260px]"
                >
                  <Link href={`/products/${slug}`} className="block">
                    <div className="relative h-48 bg-[#F7F1EA] sm:h-56">
                      <Image
                        src={
                          canUseImage(product.image)
                            ? product.image!
                            : FALLBACK_IMG
                        }
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 76vw, (max-width: 1024px) 250px, 260px"
                      />

                      <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#D7B46A] px-2.5 py-1 text-[10px] font-semibold text-[#4D2D19] shadow-[0_10px_24px_-16px_rgba(0,0,0,0.65)] sm:text-[11px]">
                        <Flame className="size-3" />
                        HOT
                      </div>
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col px-4 pb-3 pt-3 sm:px-5">
                    <div className="text-[11px] font-semibold tracking-[0.22em] text-[#B36A2E] uppercase">
                      BEST SELLER
                    </div>

                    <h3 className="mt-1 line-clamp-2 text-[15px] font-semibold text-[#3b2314] sm:text-base">
                      {product.name}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[#9E8B7C] sm:text-sm">
                      {product.description ?? ""}
                    </p>

                    <div className="mt-auto flex items-end justify-between pt-2">
                      <span className="font-display text-base font-bold text-[#7a4a2a] sm:text-lg">
                        {product.price
                          ? formatCurrency(product.price)
                          : "Giá cập nhật"}
                      </span>
                      <Link
                        href={`/products/${slug}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7a4a2a] text-white shadow-[0_16px_34px_-18px_rgba(0,0,0,0.65)] transition-transform duration-200 hover:scale-110 active:scale-95 sm:h-10 sm:w-10"
                        aria-label={`Mua ${product.name}`}
                      >
                        <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => scrollRight(bestSellerRef)}
            className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/70 p-2 text-gray-700 backdrop-blur-sm transition-colors duration-300 hover:bg-white/90 hover:text-[#7a4a2a] md:flex"
            disabled={productsLoading}
            aria-label="Next"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        </div>
      </main>

      {/* Promotions Section */}
      <main className="mx-auto w-full max-w-7xl px-3 py-4 pt-1 sm:px-4 lg:px-6">
        <div className="mb-7 mt-5 text-center sm:mb-8 sm:mt-6">
          <h1 className="text-[1.55rem] font-bold tracking-[0.08em] text-[#6a3715] sm:text-2xl sm:tracking-[0.1em] md:text-3xl md:tracking-[0.12em]">
            TIN TỨC & KHUYẾN MÃI
          </h1>
          <p className="mt-2 text-[13px] text-[#6b7280] sm:text-sm md:text-[15px]">
            Tin tức và khuyến mãi mới nhất của Tea Cafe
          </p>

          {promoLoading && (
            <p className="text-gray-600 mt-2">Đang tải khuyến mãi...</p>
          )}
          {promoError && <p className="text-red-600 mt-2">{promoError}</p>}
        </div>

        <div>
          <div className="mb-8 grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-4">
            {!promoLoading &&
              homepagePromotions.length === 0 &&
              !promoError && (
                <div className="text-gray-600 md:col-span-4">
                  Chưa có khuyến mãi.
                </div>
              )}

            {homepagePromotions.map((item) => (
              <article
                key={item.id}
                className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[6px] border border-[#d7d0c8] bg-white shadow-[0_12px_28px_-18px_rgba(0,0,0,0.34)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_38px_-24px_rgba(0,0,0,0.42)]"
                role="button"
                tabIndex={0}
                onClick={() => handleViewPromotion(item.id, item.name)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleViewPromotion(item.id, item.name);
                  }
                }}
              >
                <div className="relative aspect-[1.45/1] overflow-hidden bg-[#efe7df]">
                  {canUseImage(item.image) ? (
                    <Image
                      src={item.image as string}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[11px] text-gray-500">
                      Không có hình ảnh
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-[#ece4db] px-3 py-2 text-[10px] text-[#8f857d] sm:text-[11px]">
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {formatPromotionDateRange(item.startDate, item.endDate)}
                    </span>
                  </span>
                  <span className="shrink-0 text-[#9f9489]">{item.code}</span>
                </div>

                <div className="flex flex-1 items-start px-3 pb-4 pt-3">
                  <h3 className="line-clamp-2 text-left text-sm font-medium uppercase leading-6 text-[#343434] transition-colors duration-300 group-hover:text-[#0b7a4b] sm:text-[15px]">
                    {item.name}
                  </h3>
                </div>
              </article>
            ))}
          </div>

          {!promoLoading && homepagePromotions.length > 0 && (
            <div className="mb-8 flex justify-center">
              <Link
                href="/promotions"
                className="inline-flex w-full max-w-xs items-center justify-center border border-[#8b4f22] px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#8b4f22] transition-colors duration-200 hover:bg-[#8b4f22] hover:text-white sm:w-auto sm:max-w-none sm:px-8 sm:tracking-[0.22em]"
              >
                Xem thêm
              </Link>
            </div>
          )}

          <ChatbotWidget />
          <FloatingCartButton />
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

        .hideScrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .hideScrollbar::-webkit-scrollbar {
          display: none;
        }

        .showcaseReveal {
          opacity: 0;
          transform: translate3d(var(--showcase-x, 0), var(--showcase-y, 0), 0);
          transition:
            opacity 1s cubic-bezier(0.22, 1, 0.36, 1),
            transform 1.1s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: opacity, transform;
        }

        .showcaseRevealLeft {
          --showcase-x: -52px;
          --showcase-y: 0px;
        }

        .showcaseRevealRight {
          --showcase-x: 52px;
          --showcase-y: 0px;
        }

        .showcaseRevealTop {
          --showcase-x: 0px;
          --showcase-y: -72px;
        }

        .showcaseReveal[data-visible="true"] {
          opacity: 1;
          transform: translate3d(0, 0, 0);
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
          .hideScrollbar {
            scrollbar-width: auto;
          }
          .hideScrollbar::-webkit-scrollbar {
            display: block;
          }
          .showcaseReveal {
            opacity: 1;
            transform: none;
            transition: none;
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

function formatPromotionDateRange(startDate?: string, endDate?: string) {
  const start = formatPromotionDateToken(startDate, false);
  const end = formatPromotionDateToken(endDate, true);

  if (start && end) return `${start} - ${end}`;
  return start || end || "Đang cập nhật";
}

function formatPromotionDateToken(value?: string, includeYear = false) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");

  if (!includeYear) {
    return `${day}.${month}`;
  }

  return `${day}.${month}.${date.getFullYear()}`;
}

function normalizeProductLookup(value: string) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
