"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { CalendarDays, ChevronLeft, ChevronRight, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import { Promotion } from "@/types/promotion";
import { getPromotions } from "@/services/promotion.service";
import { ApiError } from "@/lib/utils";

const ITEMS_PER_PAGE = 12;

const canUseImage = (url: string | undefined | null) => {
  if (!url) return false;

  return /^https?:\/\//.test(url) || url.startsWith("/");
};

const SubscriptionCards: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setLoading(true);
        setError(null);

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

  const totalPages = Math.max(
    1,
    Math.ceil(activePromotions.length / ITEMS_PER_PAGE),
  );

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const pagedPromotions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return activePromotions.slice(start, start + ITEMS_PER_PAGE);
  }, [activePromotions, currentPage]);

  const pageItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  }, [currentPage, totalPages]);

  const handleViewPromotion = (id: number, name: string) => {
    const slug = toPromotionSlug(name, id);
    router.push(`/promotions/${slug}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F7F5] to-white">
      <main className="container mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <span className="inline-block rounded-full bg-amber-100 px-6 py-2 text-sm font-bold uppercase tracking-[0.2em] text-[#693916] shadow-sm">
            Ưu Đãi Đặc Biệt
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-[#693916] md:text-5xl">
            Khuyến Mãi Hấp Dẫn
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-gray-600">
            Khám phá những ưu đãi tuyệt vời dành riêng cho bạn. Đừng bỏ lỡ
            cơ hội thưởng thức cà phê chất lượng với giá ưu đãi!
          </p>
        </div>

        {loading && (
          <div className="flex min-h-[280px] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-14 w-14 rounded-full border-4 border-amber-100 border-t-[#693916] animate-spin" />
              <p className="text-sm font-medium text-[#693916]">
                Đang tải khuyến mãi...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-center text-sm text-red-600 shadow-sm">
            {error}
          </div>
        )}

        {!loading && !error && activePromotions.length === 0 && (
          <div className="py-10 text-center text-gray-500">
            Hiện chưa có khuyến mãi đang hoạt động.
          </div>
        )}

        {!loading && !error && pagedPromotions.length > 0 && (
          <>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pagedPromotions.map((promo) => (
                <article
                  key={promo.promotionId}
                  className="group cursor-pointer overflow-hidden border border-[#d5cfc7] bg-white shadow-[0_12px_26px_-24px_rgba(0,0,0,0.5)] transition-shadow duration-300 hover:shadow-[0_18px_34px_-24px_rgba(0,0,0,0.42)]"
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    handleViewPromotion(
                      promo.promotionId,
                      promo.promotionName || promo.promotionCode,
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleViewPromotion(
                        promo.promotionId,
                        promo.promotionName || promo.promotionCode,
                      );
                    }
                  }}
                >
                  <div className="relative aspect-[1.46/1] overflow-hidden border-b border-[#ebe5dc] bg-[#f7f2eb]">
                    {canUseImage(promo.imageUrl) ? (
                      <Image
                        src={promo.imageUrl as string}
                        alt={promo.promotionName ?? promo.promotionCode}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        priority={promo.promotionId <= 4}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-[#9e988f]">
                        Không có hình ảnh
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-b border-[#ebe5dc] px-3 py-2 text-[11px] text-[#948a81]">
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {formatPromotionDateRange(
                          promo.startDate,
                          promo.endDate,
                        )}
                      </span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-[#aaa097]">
                      <Ticket className="h-3.5 w-3.5" />
                      {promo.promotionCode}
                    </span>
                  </div>

                  <div className="px-3 py-3">
                    <h2 className="line-clamp-2 min-h-[3.4rem] text-[14px] font-medium uppercase leading-6 text-[#2f2f2f]">
                      {promo.promotionName || promo.promotionCode}
                    </h2>
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-[4px] border-2 border-[#ddd6ce] bg-white text-[#7d776f] transition-colors hover:border-[#c7beb4] hover:bg-[#f7f2eb] disabled:cursor-not-allowed disabled:border-[#ece7e1] disabled:text-[#d4cdc4] disabled:hover:bg-white"
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {pageItems.map((item, index) =>
                  item === "..." ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="flex h-8 min-w-[20px] items-center justify-center px-1 text-sm text-[#8f877e]"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCurrentPage(item)}
                      className={`flex h-8 min-w-8 items-center justify-center rounded-[4px] border-2 px-2 text-sm font-medium transition-colors ${
                        currentPage === item
                          ? "border-[#78c2a4] bg-[#eef9f3] text-[#2f7a58]"
                          : "border-[#cfc7be] bg-white text-[#3e3a36] hover:border-[#b8aea3] hover:bg-[#f8f5f0]"
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-[4px] border-2 border-[#cfc7be] bg-white text-[#3e3a36] transition-colors hover:border-[#b8aea3] hover:bg-[#f8f5f0] disabled:cursor-not-allowed disabled:border-[#ece7e1] disabled:text-[#d4cdc4] disabled:hover:bg-white"
                  aria-label="Trang sau"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default SubscriptionCards;

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
