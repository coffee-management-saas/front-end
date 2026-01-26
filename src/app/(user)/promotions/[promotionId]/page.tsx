import React from "react";
import { notFound } from "next/navigation";
import { getPromotionById } from "@/services/promotion.service";
import { ApiError } from "@/lib/utils";
import Image from "next/image";

function formatNumber(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

function formatMoney(n: number) {
  return `${formatNumber(n)} đ`;
}

function formatDiscount(type: string, value: number) {
  if (type === "PERCENTAGE") return `Giảm ${Math.round(value * 100)}%`;
  return `Giảm ${formatMoney(value)}`;
}

function formatDateTime(input: string) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}

function statusLabel(status: string) {
  switch (status) {
    case "ACTIVE":
      return "Đang áp dụng";
    case "INACTIVE":
      return "Tạm ngưng";
    case "EXPIRED":
      return "Hết hạn";
    default:
      return status;
  }
}

function statusPillClass(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "INACTIVE":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    case "EXPIRED":
      return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    default:
      return "bg-gray-50 text-gray-700 ring-1 ring-gray-200";
  }
}

function typeLabel(type: string) {
  switch (type) {
    case "ORDER":
      return "Áp dụng cho đơn hàng";
    default:
      return type;
  }
}
function formatDateOnly(input: string) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;

  return d.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}

export default async function PromotionDetailPage({
  params,
}: {
  params: Promise<{ promotionId: string }>;
}) {
  const { promotionId } = await params;

  let promotion: Awaited<ReturnType<typeof getPromotionById>>;
  try {
    promotion = await getPromotionById(promotionId);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const discountText = formatDiscount(
    promotion.discountType,
    promotion.discountValue,
  );

  const minSpentText = formatMoney(promotion.minimumSpent);

  const showMaxDiscount =
    promotion.discountType === "PERCENTAGE" &&
    typeof promotion.maxDiscountAmount === "number" &&
    promotion.maxDiscountAmount >= 1;

  const maxDiscountText = showMaxDiscount
    ? `Tối đa ${formatMoney(promotion.maxDiscountAmount)}`
    : null;

  const promoImage =
    "https://i.pinimg.com/1200x/15/e5/9f/15e59f3b08783718114b7fd583758ed4.jpg";

  const statusText = statusLabel(promotion.promotionStatus);

  return (
    <div className="min-h-screen overflow-hidden bg-linear-to-br from-pink-50 via-rose-50 to-amber-50">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-rose-200/60 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-amber-200/60 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(#111_1px,transparent_1px)]" />
      </div>

      <div className="relative container mx-auto px-4 py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-start">
          {/* LEFT */}
          <div className="space-y-5 pt-10">
            {/* Header */}
            <div className="rounded-3xl border border-white/70 bg-white/55 backdrop-blur-md shadow-xl p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold ${statusPillClass(
                    promotion.promotionStatus,
                  )}`}
                >
                  {statusText}
                </span>

                <span className="inline-flex items-center rounded-full bg-white text-slate-700 ring-1 ring-slate-200 px-3 py-1 text-[10px] font-semibold">
                  {discountText}
                </span>

                {maxDiscountText && (
                  <span className="inline-flex items-center rounded-full bg-white text-slate-700 ring-1 ring-slate-200 px-3 py-1 text-[10px] font-semibold">
                    {maxDiscountText}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
                {promotion.promotionName}
              </h1>

              <div className="mt-2 text-xs text-slate-600">
                Mã khuyến mãi:{" "}
                <span className="font-semibold text-slate-900">
                  {promotion.promotionCode}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="rounded-2xl bg-white/70 border border-white/70 p-3">
                  <div className="text-[10px] text-slate-500">
                    Đơn tối thiểu
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    {minSpentText}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/70 border border-white/70 p-3">
                  <div className="text-[10px] text-slate-500">Mỗi khách</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    {promotion.usageLimitPerUser} lần
                  </div>
                </div>

                <div className="rounded-2xl bg-white/70 border border-white/70 p-3 col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-slate-500">Số lượng</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    {formatNumber(promotion.quantity)}
                  </div>
                </div>
              </div>
            </div>

            {/* Detail cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="group rounded-3xl border border-white/70 bg-white/55 backdrop-blur-md shadow-lg p-4 transition hover:-translate-y-0.5 hover:shadow-xl">
                <div className="text-[10px] text-slate-500">Ưu đãi</div>
                <div className="mt-1 text-sm font-extrabold text-slate-900">
                  {discountText}
                </div>
                {maxDiscountText && (
                  <div className="mt-1 text-[11px] text-slate-600">
                    {maxDiscountText}
                  </div>
                )}
              </div>

              <div className="group rounded-3xl border border-white/70 bg-white/55 backdrop-blur-md shadow-lg p-4 transition hover:-translate-y-0.5 hover:shadow-xl">
                <div className="text-[10px] text-slate-500">
                  Thời gian áp dụng
                </div>

                <div className="mt-1 flex items-center gap-2 text-[12px] font-semibold text-slate-900">
                  <span className="whitespace-nowrap">
                    {formatDateOnly(promotion.startDate)}
                  </span>

                  <span className="text-slate-500 font-normal">→</span>

                  <span className="whitespace-nowrap">
                    {formatDateOnly(promotion.endDate)}
                  </span>
                </div>

                <div className="mt-2 text-[11px] text-slate-500">
                  Trạng thái: {statusText}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-wrap gap-2">
              <button className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-lg transition hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
                Dùng mã: {promotion.promotionCode}
              </button>

              {/* <a
                href="/promotions"
                className="px-5 py-2.5 rounded-full bg-white/70 border border-white/70 text-slate-700 text-xs font-semibold shadow-lg transition hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                Quay lại danh sách
              </a> */}
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:sticky lg:top-24 flex items-start justify-center pt-10">
            <div className="relative w-full max-w-sm">
              <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/55 backdrop-blur-md shadow-2xl">
                {/* Image smaller */}
                <div className="relative aspect-3/4 w-full">
                  <Image
                    src={promoImage}
                    alt={promotion.promotionName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 420px"
                    priority
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/10 to-transparent" />

                  {/* Top badges */}
                  <div className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold text-slate-900 shadow">
                    {statusText}
                  </div>

                  <div className="absolute top-3 right-3 rounded-full bg-rose-600 px-3 py-1 text-[10px] font-semibold text-white shadow">
                    {discountText}
                  </div>

                  {/* Bottom overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-white/90">
                      <span className="rounded-full bg-white/15 px-2 py-1">
                        CODE: {promotion.promotionCode}
                      </span>
                      <span className="rounded-full bg-white/15 px-2 py-1">
                        MIN: {minSpentText}
                      </span>
                      {maxDiscountText && (
                        <span className="rounded-full bg-white/15 px-2 py-1">
                          {maxDiscountText}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* small blobs */}
              <div className="pointer-events-none absolute -z-10 -top-6 -right-6 h-20 w-20 rounded-full bg-rose-200/70 blur-xl" />
              <div className="pointer-events-none absolute -z-10 -bottom-6 -left-6 h-24 w-24 rounded-full bg-amber-200/70 blur-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
