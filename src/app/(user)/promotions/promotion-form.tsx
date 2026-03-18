"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Promotion } from "@/types/promotion";
import { useRouter } from "next/navigation";
import { getPromotions } from "@/services/promotion.service";
import { ApiError } from "@/lib/utils";

const canUseImage = (url: string | undefined | null) => {
  if (!url) return false;

  return /^https?:\/\//.test(url) || url.startsWith("/");
};

const moneyFormatter = new Intl.NumberFormat("vi-VN");

const getDiscountText = (
  discountType: Promotion["discountType"],
  discountValue: number,
) => {
  if (discountType === "PERCENTAGE") {
    return `${discountValue}%`;
  }

  return `${moneyFormatter.format(discountValue)}đ`;
};

const buildPromoDescription = (promo: Promotion) => {
  const discountText = getDiscountText(promo.discountType, promo.discountValue);
  if (promo.minimumSpent > 0) {
    return `Giảm ${discountText} cho đơn tối thiểu ${moneyFormatter.format(promo.minimumSpent)}đ.`;
  }
  return `Giảm ${discountText} áp dụng cho mọi đơn hàng.`;
};

const bannerThemes = [
  {
    bar: "bg-amber-400",
    badgeGradient: "from-amber-400 to-orange-500",
    badgeText: "text-amber-200",
    highlightText: "text-amber-300",
    buttonHover: "hover:bg-amber-50",
  },
];

const getBannerTheme = (index: number) =>
  bannerThemes[index % bannerThemes.length];

const SubscriptionCards: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Public like homepage: don't require login and don't send Bearer token.
        const data = await getPromotions(undefined, { viaNextApi: true });
        setPromotions(Array.isArray(data) ? data : []);
      } catch (e: unknown) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          setError("Bạn không có quyền xem khuyến mãi.");
        } else {
          setError(e instanceof Error ? e.message : String(e));
        }
        setPromotions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, []);

  const activePromotions = useMemo(() => {
    const active = promotions.filter((p) => p.promotionStatus === "ACTIVE");
    return active.sort((a, b) => {
      const aStart = Date.parse(a.startDate ?? "");
      const bStart = Date.parse(b.startDate ?? "");
      const aEnd = Date.parse(a.endDate ?? "");
      const bEnd = Date.parse(b.endDate ?? "");

      if (!Number.isNaN(aStart) && !Number.isNaN(bStart) && aStart !== bStart) {
        return aStart - bStart;
      }
      if (!Number.isNaN(aEnd) && !Number.isNaN(bEnd) && aEnd !== bEnd) {
        return aEnd - bEnd;
      }
      return a.promotionId - b.promotionId;
    });
  }, [promotions]);

  const handleViewPromotion = (id: number, name: string) => {
    const slug = toPromotionSlug(name, id);
    router.push(`/promotions/${slug}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F7F5] to-white">
      <main className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <span className="text-sm font-bold text-[#693916] uppercase tracking-[0.2em] bg-amber-100 px-6 py-2 rounded-full shadow-sm">
              Ưu Đãi Đặc Biệt
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#693916] mb-4 tracking-tight">
            Khuyến Mãi Hấp Dẫn
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Khám phá những ưu đãi tuyệt vời dành riêng cho bạn. Đừng bỏ lỡ cơ
            hội thưởng thức cà phê chất lượng với giá ưu đãi!
          </p>
        </div>

        {/* Hero Banners */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mb-16">
          {activePromotions.map((promo, index) => {
            const theme = getBannerTheme(index);
            return (
              <div
                key={promo.promotionId}
                className="group relative h-[240px] sm:h-[280px] lg:h-[300px] xl:h-[320px] overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 ring-1 ring-black/5"
                role="button"
                tabIndex={0}
                onClick={() =>
                  handleViewPromotion(
                    promo.promotionId,
                    promo.promotionName || promo.promotionCode,
                  )
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleViewPromotion(
                      promo.promotionId,
                      promo.promotionName || promo.promotionCode,
                    );
                  }
                }}
              >
                <Image
                  src={
                    canUseImage(promo.imageUrl)
                      ? (promo.imageUrl as string)
                      : "/images/banner1.png"
                  }
                  alt={promo.promotionName ?? "Promotion"}
                  fill
                  className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  priority={index < 3}
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                {/* Animated Badge */}
                <div className="absolute top-5 right-5 animate-pulse">
                  <div
                    className={`bg-gradient-to-r ${theme.badgeGradient} text-white px-4 py-2 rounded-full shadow-lg`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                      Đang áp dụng
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-1 w-12 ${theme.bar} rounded-full`}
                      ></div>
                      <span
                        className={`${theme.badgeText} text-sm font-semibold uppercase tracking-wider`}
                      >
                        Khuyến Mãi Đặc Biệt
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                      {promo.promotionName ?? promo.promotionCode}
                    </h3>
                    <p className="text-white/90 text-sm leading-relaxed max-w-md">
                      Ưu đãi với mã{" "}
                      <span className={`font-bold ${theme.highlightText}`}>
                        {promo.promotionCode}
                      </span>
                      {`. ${buildPromoDescription(promo)}`}
                    </p>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleViewPromotion(
                          promo.promotionId,
                          promo.promotionName || promo.promotionCode,
                        );
                      }}
                      className={`mt-4 bg-white text-[#693916] px-6 py-3 rounded-full font-bold ${theme.buttonHover} transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1`}
                    >
                      Xem Chi Tiết →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!loading && !error && activePromotions.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            Hiện chưa có khuyến mãi đang hoạt động.
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-amber-200 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-[#693916] border-t-transparent rounded-full animate-spin absolute top-0"></div>
            </div>
            <p className="mt-6 text-gray-500 font-medium">
              Đang tải khuyến mãi...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="max-w-md mx-auto text-center py-12 px-6 bg-red-50 rounded-2xl border-2 border-red-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default SubscriptionCards;

function toPromotionSlug(name: string | null | undefined, id: number) {
  const safeName = name || "";
  const base = safeName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  return `${base || "khuyen-mai"}-${id}`;
}
