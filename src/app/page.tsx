"use client";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { Promotion } from "@/types/promotion";
import { useRouter } from "next/navigation";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  isBestSeller?: boolean;
  badge?: string;
}
const canUseImage = (url: string | undefined | null) => {
  if (!url) return false;
  // allow absolute http(s) or root-relative paths; block other invalid strings to avoid URL constructor errors
  return /^https?:\/\//.test(url) || url.startsWith("/");
};

const Homepage: React.FC = () => {
  const [cart, setCart] = useState(0);
  const bestSellerRef = useRef<HTMLDivElement>(null);
  const newsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Thông tin về sản phẩm nước
  const products: Product[] = [
    {
      id: 1,
      name: "Trà Sữa Phúc Long (L)",
      price: 59000,
      image:
        "https://i.pinimg.com/1200x/75/ba/43/75ba4318c46a055ba70d0960f633f1a9.jpg",
      isBestSeller: true,
    },
    {
      id: 2,
      name: "Trà Sữa Ô Long (L)",
      price: 59000,
      image:
        "https://i.pinimg.com/736x/a8/b1/da/a8b1da9c14e36a4c8974bb0ac40baece.jpg",
    },
    {
      id: 3,
      name: "Hồng Trà Sữa (L)",
      price: 55000,
      image:
        "https://i.pinimg.com/1200x/5f/b3/5b/5fb35b8baed1fc4ce4564f4913a0b9c7.jpg",
      badge: "Hồng Trà Sữa (L)",
    },
    {
      id: 4,
      name: "Trà Sữa Lai (M)",
      price: 55000,
      image:
        "https://i.pinimg.com/1200x/5f/d6/d3/5fd6d350f1c64bc22aa28aec4126cff2.jpg",
    },
    {
      id: 5,
      name: "Trà Sữa Ô Long Quế Hoa (L)",
      price: 55000,
      image:
        "https://i.pinimg.com/1200x/17/77/9e/17779e0be05214b05bc578c8346a06da.jpg",
    },
    {
      id: 6,
      name: "Trà Sữa Ô Long Quế Hoa (L)",
      price: 55000,
      image:
        "https://i.pinimg.com/736x/f8/56/5b/f8565b7442a9df396adc387c8555d8b4.jpg",
    },
  ];

  // Thông tin về sản phẩm nước
  const newMenu: Product[] = [
    {
      id: 1,
      name: "Trà Sữa Phúc Long (L)",
      price: 59000,
      image:
        "https://s3-hcmc02.higiocloud.vn/images/2026/01/ly_giay_tet_websitecover_2560x768-20260113032405.jpg",
      isBestSeller: true,
    },
    {
      id: 2,
      name: "Trà Sữa Ô Long (L)",
      price: 59000,
      image:
        "https://i.pinimg.com/1200x/29/22/14/292214e4e318c2b8a245191da9c1e2f9.jpg",
    },
    {
      id: 3,
      name: "Hồng Trà Sữa (L)",
      price: 55000,
      image:
        "https://i.pinimg.com/1200x/dd/70/0f/dd700f4d71d9f001992ca382f49ac02c.jpg",
      badge: "Hồng Trà Sữa (L)",
    },
  ];

  const handleAddToCart = () => {
    setCart(cart + 1);
  };

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

  const [active, setActive] = useState(0);
  const [perView, setPerView] = useState(1);
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

  const bannerPages = useMemo(() => newMenu.map((_, i) => i), [newMenu.length]);

  useEffect(() => {
    if (bannerPages.length <= 1) return;
    const t = setInterval(() => {
      setActive((prev) => (prev + 1) % bannerPages.length);
    }, 3000);
    return () => clearInterval(t);
  }, [bannerPages.length]);
  // gọi api cho promotion
  useEffect(() => {
    const controller = new AbortController();

    const fetchPromotions = async () => {
      try {
        setLoading(true);
        setError(null);

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

        setError(e instanceof Error ? e.message : String(e));
        setPromotions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();

    return () => controller.abort();
  }, []);
  const itemsForUI = useMemo(() => {
    return promotions.map((p, idx) => ({
      id: p.promotionId,
      name: p.promotionName || p.promotionCode,
      code: p.promotionCode,
      image: p.imageUrl,

      status: p.status ?? p.promotionStatus,
    }));
  }, [promotions]);

  return (
    <div className="min-h-screen bg-gray-50 pt-7">
      {/* Main Content cho các sản phẩm mới - landing page */}
      <main className="w-full pt-7">
        <div className="relative w-full">
          {/* Banner (chỉ 1 ảnh mỗi lần) */}
          <div className="relative w-full overflow-hidden">
            <div className="relative w-full h-45 sm:h-60 md:h-80 lg:h-100">
              <Image
                src={newMenu[active]?.image || "/fallback.jpg"}
                alt={newMenu[active]?.name || "banner"}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
            </div>
          </div>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {bannerPages.map((_, i) => (
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

      {/* Main Content sản phẩm */}
      <main className="container mx-auto px-2 py-4 pt-1">
        {/* Title Section */}
        <div className="text-center mb-12 mt-6">
          <h1 className="text-2xl md:text-2xl font-bold text-amber-700 mb-2">
            BEST SELLERS - TRÀ SỮA ĐẬM VỊ
          </h1>
        </div>

        {/* Products Grid */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => scrollLeft(bestSellerRef)}
            className="bg-white shadow-md rounded-full p-2 hover:bg-gray-100 transition-colors duration-300 flex-shrink-0"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div
            ref={bestSellerRef}
            className="flex overflow-x-hidden gap-4 pb-4 mb-8 flex-1"
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 shrink-0 w-48"
              >
                {/* Product Image */}
                <div className="relative bg-gray-100 h-32 flex items-center justify-center">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>

                {/* Product Info */}
                <div className="p-2">
                  <h3 className="text-xs font-semibold text-gray-800 mb-1 h-8 text-xs leading-tight">
                    {product.name}
                  </h3>
                  <p
                    className="text-base font-bold text-amber-700 mb-2"
                    suppressHydrationWarning
                  >
                    {product.price.toLocaleString("vi-VN")} ₫
                  </p>

                  <button
                    onClick={handleAddToCart}
                    className="w-full bg-amber-700 hover:bg-amber-700 text-white font-semibold py-1 rounded-lg transition-colors duration-300 flex items-center justify-center gap-1 text-xs"
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
            className="bg-white shadow-md rounded-full p-2 hover:bg-gray-100 transition-colors duration-300 flex-shrink-0"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </main>
      {/* Main Content tin tức & khuyến mãi */}
      <main className="container mx-auto px-2 py-4 pt-1">
        <div className="text-center mb-12 mt-6">
          <h1 className="text-2xl md:text-2xl font-bold text-amber-700 mb-2">
            TIN TỨC & KHUYẾN MÃI
          </h1>

          {loading && (
            <p className="text-gray-600 mt-2">Đang tải khuyến mãi...</p>
          )}
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => scrollLeft(newsRef)}
            className="bg-white shadow-md rounded-full p-2 hover:bg-gray-100 transition-colors duration-300 flex-shrink-0"
            disabled={loading}
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          <div
            ref={newsRef}
            className="flex overflow-x-hidden gap-4 pb-4 mb-8 flex-1"
          >
            {!loading && itemsForUI.length === 0 && !error && (
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
                  {/* Tên khuyến mãi */}
                  <h3 className="text-xs font-semibold text-gray-800 mb-1 h-5 leading-tight line-clamp-2">
                    {item.name}
                  </h3>

                  {/* Mã khuyến mãi (thông tin phụ) */}
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
            disabled={loading}
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </main>

      {/* Floating Cart Button */}
      <button className="fixed bottom-8 right-8 w-16 h-16 bg-amber-700 hover:bg-amber-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110">
        <ShoppingCart className="w-8 h-8" />
        {cart > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-sm w-7 h-7 rounded-full flex items-center justify-center font-bold">
            {cart}
          </span>
        )}
      </button>
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
