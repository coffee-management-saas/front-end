"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Promotion } from "@/types/promotion";
import { useRouter } from "next/navigation";

const canUseImage = (url: string | undefined | null) => {
  if (!url) return false;

  return /^https?:\/\//.test(url) || url.startsWith("/");
};

const SubscriptionCards: React.FC = () => {
  const [cart, setCart] = useState(0);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const newsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchPromotions = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/promotion", {
          method: "GET",
          headers: { Accept: "application/json" },
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
      status: p.promotionStatus,
    }));
  }, [promotions]);

  const handleViewPromotion = (id: number, name: string) => {
    const slug = toPromotionSlug(name, id);
    router.push(`/promotions/${slug}`);
  };

  const scrollLeft = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) ref.current.scrollBy({ left: -200, behavior: "smooth" });
  };

  const scrollRight = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) ref.current.scrollBy({ left: 200, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-2 py-4 pt-1">
        <div className="text-center mb-12 mt-6">
          <h1 className="text-2xl md:text-2xl font-bold text-[#693916] mb-2">
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

            {itemsForUI.map((item) => {
              const slug = toPromotionSlug(item.name, item.id);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-soft overflow-hidden hover:shadow-card-hover transition-shadow duration-300 flex-shrink-0 w-[220px]"
                >
                  <Link
                    href={`/promotions/${slug}`}
                    className="relative block bg-gray-100 h-56"
                    aria-label={`Xem khuyen mai ${item.name}`}
                  >
                    {canUseImage(item.image) ? (
                      <Image
                        src={item.image as string}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="220px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[11px] text-gray-500">
                        Không có hình ảnh
                      </div>
                    )}
                  </Link>

                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2">
                      {item.name}
                    </h3>

                    <p className="text-xs text-gray-600 mb-3 truncate">
                      Mã CODE: {item.code}
                    </p>

                    <button
                      onClick={() => handleViewPromotion(item.id, item.name)}
                      className="w-full bg-[#693916] hover:bg-[#693a19] text-white font-semibold py-2 rounded-lg transition-colors duration-300 flex items-center justify-center gap-1 text-sm"
                    >
                      Xem ngay
                    </button>
                  </div>
                </div>
              );
            })}
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
    </div>
  );
};

export default SubscriptionCards;

function toPromotionSlug(name: string, id: number) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  return `${base || "khuyen-mai"}-${id}`;
}
