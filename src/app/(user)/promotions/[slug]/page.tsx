"use client";

import React, { useEffect, useMemo, useState } from "react";
import { canUseImage, FALLBACK_IMG } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Clock, Calendar, CheckCircle2 } from "lucide-react";
import { Promotion } from "@/types/promotion";

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

const buildUsageSteps = (promo: Promotion) => {
  const steps: string[] = [
    `Nhập mã ${promo.promotionCode} khi thanh toán.`,
    `Ưu đãi ${getDiscountText(promo.discountType, promo.discountValue)} sẽ được áp dụng tự động.`,
  ];

  if (promo.minimumSpent > 0) {
    steps.push(
      `Đơn hàng tối thiểu ${moneyFormatter.format(promo.minimumSpent)}đ.`,
    );
  }

  return steps;
};

const buildTerms = (promo: Promotion) => {
  const typeLabel =
    promo.promotionType === "PRODUCT"
      ? "Sản phẩm"
      : promo.promotionType === "ORDER"
        ? "Đơn hàng"
        : promo.promotionType;

  const terms: string[] = [
    `Áp dụng cho loại khuyến mãi ${typeLabel}.`,
    `Thời gian: ${formatDate(promo.startDate)} - ${formatDate(promo.endDate)}.`,
  ];

  if (promo.maxDiscountAmount > 0) {
    terms.push(
      `Giảm tối đa ${moneyFormatter.format(promo.maxDiscountAmount)}đ.`,
    );
  }

  if (promo.minimumSpent > 0) {
    terms.push(
      `Không áp dụng cho đơn dưới ${moneyFormatter.format(promo.minimumSpent)}đ.`,
    );
  }

  terms.push("Không áp dụng đồng thời với các chương trình khuyến mãi khác.");

  return terms;
};

const formatDate = (value?: string) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("vi-VN");
};


export default function PromotionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slugParam = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const promotionId = useMemo(() => {
    if (!slugParam) return null;
    const match = String(slugParam).match(/-(\d+)$/);
    return match ? Number(match[1]) : null;
  }, [slugParam]);

  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!promotionId) {
      setError("Slug không hợp lệ.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchPromotion = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/promotion/${promotionId}`, {
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
              : `Fetch promotion failed (status ${res.status})`;
          throw new Error(msg);
        }

        if (!payload || typeof payload !== "object") {
          throw new Error("Dữ liệu promotion không đúng format.");
        }

        setPromotion(payload as Promotion);
      } catch (e: unknown) {
        const isAbortError =
          e instanceof DOMException && e.name === "AbortError";
        if (isAbortError) return;

        setError(e instanceof Error ? e.message : String(e));
        setPromotion(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotion();

    return () => controller.abort();
  }, [promotionId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F7F5] to-white">
      <main className="w-full">
        <div className="px-4 py-6 md:px-8">
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/"
              className="font-medium text-[#693916] transition-colors hover:text-[#876F60]"
            >
              Trang chủ
            </Link>
            <span className="text-[#bdb4aa]">/</span>
            <Link
              href="/promotions"
              className="font-medium text-[#693916] transition-colors hover:text-[#876F60]"
            >
              Khuyến mãi
            </Link>
            {promotion && (
              <>
                <span className="text-[#bdb4aa]">/</span>
                <span className="truncate font-medium text-black">
                  {promotion.promotionName ?? promotion.promotionCode}
                </span>
              </>
            )}
          </nav>
        </div>

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

        {error && !loading && (
          <div className="max-w-md mx-auto text-center py-12 px-6 bg-red-50 rounded-2xl border-2 border-red-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {promotion && !loading && !error && (
          <div className="px-4 md:px-8 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              <div className="relative h-[520px] md:h-[680px] lg:h-[760px] rounded-3xl overflow-hidden shadow-xl">
                <Image
                  src={
                    canUseImage(promotion.imageUrl)
                      ? (promotion.imageUrl as string)
                      : FALLBACK_IMG
                  }
                  alt={promotion.promotionName ?? "Promotion"}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 px-5 md:px-6 pb-6 text-white">
                  <div className="flex items-center gap-3">
                    <div className="h-0.5 w-10 bg-amber-400 rounded-full"></div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-200">
                      Khuyến Mãi Đặc Biệt
                    </span>
                  </div>
                  <h1 className="mt-3 text-2xl md:text-3xl font-bold">
                    {promotion.promotionName ?? promotion.promotionCode}
                  </h1>
                  <p className="mt-2 text-white/90 text-sm md:text-base">
                    Mã ưu đãi:{" "}
                    <span className="font-semibold">
                      {promotion.promotionCode}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 md:p-8 border-2 border-amber-200 border-dashed">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {promotion.discountType === "FIXED_AMOUNT" ? "đ" : "%"}
                      </span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-[#693916]">
                      {`Ưu đãi ${getDiscountText(
                        promotion.discountType,
                        promotion.discountValue,
                      )}`}
                    </h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-base md:text-lg">
                    {buildPromoDescription(promotion)}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200">
                    <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">
                        Thời gian áp dụng
                      </h4>
                      <p className="text-sm text-gray-600">
                        Theo điều kiện chương trình
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200">
                    <Calendar className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">
                        Thời hạn khuyến mãi
                      </h4>
                      <p className="text-sm text-gray-600">
                        {`${formatDate(promotion.startDate)} - ${formatDate(
                          promotion.endDate,
                        )}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-gray-800 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Cách sử dụng
                  </h4>
                  <ol className="space-y-2 text-sm text-gray-700 ml-7">
                    {buildUsageSteps(promotion).map((step, index) => (
                      <li key={step} className="flex gap-2">
                        <span className="font-semibold min-w-[20px]">
                          {index + 1}.
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-gray-800">
                    Điều khoản & Điều kiện
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {buildTerms(promotion).map((term) => (
                      <li key={term} className="flex gap-2">
                        <span className="text-amber-600">•</span>
                        <span>{term}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => router.push("/menu")}
                  className="w-full bg-gradient-to-r from-[#693916] to-[#876F60] hover:from-[#876F60] hover:to-[#693916] text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Đặt hàng ngay
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
