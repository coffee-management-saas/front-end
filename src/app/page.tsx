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

const FEATURED_PRODUCT_NAME = "Sinh tố Lục Xuân";
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
    }));
  }, [promotions]);
  const homepagePromotions = itemsForUI.slice(0, 3);

  const productsForUI = Array.isArray(products) ? products : [];
  const featuredProduct =
    featuredProductOverride ??
    productsForUI.find((product) =>
      normalizeProductLookup(product.name).includes(FEATURED_PRODUCT_KEY),
    ) ??
    productsForUI[0];
  const featuredProductHref = featuredProduct
    ? `/products/${toProductSlug(featuredProduct.name, featuredProduct.id)}`
    : "/menu";
  const featuredProductDescription =
    featuredProduct?.description?.trim() ||
    "Sản phẩm mới vừa ra mắt với hương vị tươi sáng, dễ uống và được hoàn thiện để tạo ấn tượng ngay từ lần thử đầu tiên.";
  const featuredProductPrice = featuredProduct?.price
    ? formatCurrency(featuredProduct.price)
    : "Pha chế tại quầy";
  const showcaseSlides = useMemo(
    () => [
      {
        key: "featured-default",
        imageSrc: "/images/export-02-cutout-preview3.png",
        imageAlt: featuredProduct?.name ?? "Signature coffee",
        eyebrow: "Má»›i ra máº¯t",
        title: featuredProduct?.name ?? "Signature Coffee",
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
        imageAlt: featuredProduct?.name ?? "Hero coffee visual",
        eyebrow: "Hero spotlight",
        title: featuredProduct?.name ?? "Signature Coffee",
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
            <div className="relative w-full h-60 sm:h-80 md:h-[420px] lg:h-[520px]">
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

      <section
        ref={showcaseRef}
        aria-label="Signature showcase"
        className="relative overflow-hidden bg-[linear-gradient(180deg,#f8efe5_0%,#fff9f4_48%,#ffffff_100%)] py-16 sm:py-20 lg:py-24"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#ead8c6]/80 to-transparent" />
        <div className="pointer-events-none absolute -left-16 top-20 h-64 w-64 rounded-full bg-[#b87646]/15 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-28 h-72 w-72 rounded-full bg-[#f2d5bb]/55 blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-white/80 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className="showcaseReveal showcaseRevealTop mx-auto mb-12 max-w-3xl text-center lg:mb-16"
            data-showcase-reveal
            data-visible="false"
            style={{ transitionDelay: "80ms" }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[#dec7b3] bg-white/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8a5a39] shadow-[0_12px_28px_-20px_rgba(76,41,18,0.55)]">
              <Coffee className="h-4 w-4" />
              Sản phẩm mới ra mắt
            </span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-[#4d2d19] sm:text-4xl lg:text-5xl">
              Khám phá hương vị mới vừa có mặt tại Tea Cafe
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#7b6554] sm:text-lg">
              Một sản phẩm mới ra mắt dành cho khách muốn thử trải nghiệm khác
              biệt, tươi mới và dễ chọn ngay từ lần đầu.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center lg:gap-8">
            <div
              className="showcaseReveal showcaseRevealLeft order-2 space-y-5 lg:order-1 lg:col-span-4"
              data-showcase-reveal
              data-visible="false"
              style={{ transitionDelay: "140ms" }}
            >
              {showcaseItemsLeft.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-[28px] border border-white/80 bg-white/80 p-5 shadow-[0_24px_60px_-42px_rgba(70,35,12,0.6)] backdrop-blur-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f5e3d5] text-[#8a5a39] shadow-inner">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight text-[#442615]">
                        {title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-[#7b6554] sm:text-[15px]">
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
                <div className="w-full overflow-hidden rounded-[34px]">
                  <div className="relative mx-auto mt-4 w-full max-w-[500px]">
                    <Image
                      src="/images/export-02-cutout-preview3.png"
                      alt={featuredProduct?.name ?? "Signature coffee"}
                      width={1314}
                      height={1847}
                      className="animate-float h-auto w-full object-contain"
                      sizes="(max-width: 768px) 78vw, (max-width: 1280px) 36vw, 500px"
                    />
                  </div>

                  <div className="mt-6 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#a17250]">
                      Mới ra mắt
                    </p>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight text-[#442615] sm:text-[2rem]">
                      {featuredProduct?.name ?? "Signature Coffee"}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[#7b6554] sm:text-[15px]">
                      {featuredProductDescription}
                    </p>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      <span className="rounded-full border border-white/80 bg-white px-4 py-2 text-sm font-semibold text-[#6f3d20] shadow-[0_18px_36px_-26px_rgba(64,34,13,0.68)]">
                        {featuredProductPrice}
                      </span>
                      <Link
                        href={featuredProductHref}
                        className="rounded-full bg-[#6f3d20] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_22px_40px_-28px_rgba(64,34,13,0.82)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#824928]"
                      >
                        {featuredProduct ? "Khám phá ngay" : "Xem menu mới"}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="showcaseReveal showcaseRevealRight order-3 space-y-5 lg:col-span-4"
              data-showcase-reveal
              data-visible="false"
              style={{ transitionDelay: "300ms" }}
            >
              {showcaseItemsRight.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-[28px] border border-white/80 bg-white/80 p-5 shadow-[0_24px_60px_-42px_rgba(70,35,12,0.6)] backdrop-blur-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f5e3d5] text-[#8a5a39] shadow-inner">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight text-[#442615]">
                        {title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-[#7b6554] sm:text-[15px]">
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
                  className="group shrink-0 w-[240px] sm:w-[250px] lg:w-[260px] overflow-hidden border border-[#EDE2D7] bg-white shadow-[0_18px_50px_-34px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_-40px_rgba(0,0,0,0.55)] flex flex-col"
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

        <div>
          <div className="grid grid-cols-1 gap-6 pb-4 mb-8 md:grid-cols-2 xl:grid-cols-3">
            {!promoLoading &&
              homepagePromotions.length === 0 &&
              !promoError && (
                <div className="text-gray-600">Chưa có khuyến mãi.</div>
              )}

            {homepagePromotions.map((item) => (
              <div
                key={item.id}
                className="group flex cursor-pointer flex-col"
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
                <div className="relative aspect-[1/1.02] overflow-hidden bg-[#efe7df]">
                  {canUseImage(item.image) ? (
                    <Image
                      src={item.image as string}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[11px] text-gray-500">
                      Không có hình ảnh
                    </div>
                  )}
                </div>

                <div className="px-2 pb-2 pt-4 text-center">
                  <h3 className="line-clamp-2 text-lg font-black uppercase tracking-tight text-[#343434] transition-colors duration-300 group-hover:text-[#b62028] sm:text-xl">
                    {item.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          {!promoLoading && homepagePromotions.length > 0 && (
            <div className="mb-8 flex justify-center">
              <Link
                href="/promotions"
                className="inline-flex items-center justify-center border border-[#8b4f22] px-8 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#8b4f22] transition-colors duration-200 hover:bg-[#8b4f22] hover:text-white"
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

function normalizeProductLookup(value: string) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
