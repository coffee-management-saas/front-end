"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { Promotion } from "@/types/promotion";
import { useRouter } from "next/navigation";

const FALLBACK_IMAGES = [
  "https://i.pinimg.com/736x/5e/fe/ef/5efeefde66fb51a9c3cf727336312d5d.jpg",
  "https://i.pinimg.com/736x/95/49/0c/95490c7ff1918c006114347b834d6faf.jpg",
  "https://i.pinimg.com/1200x/4a/ad/3a/4aad3ab445759dc77d1d0f47818411a6.jpg",
  "https://i.pinimg.com/1200x/4a/0a/0f/4a0a0f55f41ea855c05605765c71be32.jpg",
  "https://i.pinimg.com/736x/51/c6/07/51c6075b5b11f4e0cafc153d698fbe8e.jpg",
  "https://i.pinimg.com/736x/64/d7/2e/64d72e14084b39358fad5c4354c4f05f.jpg",
];

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

        const res = await fetch("api/promotion", {
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
      image: FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length],
      status: p.promotionStatus,
    }));
  }, [promotions]);

  const handleViewPromotion = (id: number) => {
    router.push(`/promotions/${id}`);
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
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover rounded-lg"
                  />
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
                    onClick={() => handleViewPromotion(item.id)}
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

      {/* <button className="fixed bottom-8 right-8 w-16 h-16 bg-amber-700 hover:bg-amber-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110">
        <ShoppingCart className="w-8 h-8" />
        {cart > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-sm w-7 h-7 rounded-full flex items-center justify-center font-bold">
            {cart}
          </span>
        )}
      </button> */}
    </div>
  );
};

export default SubscriptionCards;
