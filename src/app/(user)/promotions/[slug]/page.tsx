import React from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPromotionById } from "@/services/promotion.service";
import { ApiError } from "@/lib/utils";

const ALLOWED_IMAGE_HOSTS = ["i.pinimg.com", "s3-hcmc02.higiocloud.vn"];

function canUseImage(url: string | undefined): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return ALLOWED_IMAGE_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

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
      return "bg-emerald-600 text-white";
    case "INACTIVE":
      return "bg-amber-500 text-white";
    case "EXPIRED":
      return "bg-rose-600 text-white";
    default:
      return "bg-gray-600 text-white";
  }
}

function typeLabel(type: string) {
  switch (type) {
    case "ORDER":
      return "Áp dụng cho đơn hàng";
    default:
      return "Áp dụng cho sản phẩm";
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
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const promotionId = extractIdFromSlug(slug);
  if (!promotionId) notFound();

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

  const promoImage = canUseImage(promotion.imageUrl)
    ? promotion.imageUrl
    : null;

  const statusText = statusLabel(promotion.promotionStatus);

  return (
    <div className="min-h-screen bg-[#F9F7F5] pt-20 pb-10 px-3 text-slate-900">
      <div className="mx-auto max-w-7xl grid gap-10 lg:gap-14 lg:grid-cols-[3fr_2fr] lg:items-start">
        {/* LEFT */}
        <section className="space-y-6">
          {/* Header label */}
          <div className="flex items-center gap-2 text-[#7d542b] font-semibold tracking-wide">
            <span className="text-lg">✧</span>
            <span className="uppercase text-sm">Chi tiết khuyến mãi</span>
          </div>

          {/* Big title */}
          <h1 className="text-[42px] leading-tight md:text-[56px] font-extrabold">
            <span className="text-[#2b2b2b]">{promotion.promotionName}</span>
          </h1>

          {/* Pills row */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${statusPillClass(
                promotion.promotionStatus,
              )}`}
            >
              <span className="h-2 w-2 rounded-full bg-white/90" />
              {statusText}
            </span>

            <span className="inline-flex items-center gap-2 rounded-full bg-[#ef476f] text-white px-4 py-2 text-sm font-semibold">
              🎁 {discountText}
            </span>

            <span className="inline-flex items-center gap-2 rounded-full bg-[#222] text-white px-4 py-2 text-sm font-semibold">
              <span className="opacity-80">CODE:</span>{" "}
              {promotion.promotionCode}
            </span>

            {maxDiscountText && (
              <span className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 border border-black/5 shadow-sm">
                {maxDiscountText}
              </span>
            )}
          </div>

          {/* Apply + date row */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              {typeLabel(promotion.promotionType)}
            </span>

            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm border border-black/5">
              <span className="text-[#ef476f]">📅</span>
              <span className="text-gray-600">Từ</span>
              <span className="font-semibold text-[#ef476f]">
                {formatDateOnly(promotion.startDate)}
              </span>
              <span className="text-gray-400">→</span>
              <span className="font-semibold text-[#ef476f]">
                {formatDateOnly(promotion.endDate)}
              </span>
            </span>
          </div>

          {/* Conditions box */}
          <div className="rounded-3xl bg-white shadow-sm border border-black/5 p-5 md:p-6">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-6 w-1.5 rounded-full bg-[#ef476f]" />
              <div className="w-full">
                <h2 className="text-xl font-extrabold text-[#2b2b2b]">
                  ĐIỀU KIỆN ÁP DỤNG
                </h2>

                <ul className="mt-4 space-y-3 text-gray-700">
                  <li className="flex gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-emerald-600" />
                    <span>
                      Áp dụng cho{" "}
                      {typeLabel(promotion.promotionType).toLowerCase()} trên
                      toàn hệ thống.
                    </span>
                  </li>

                  <li className="flex gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-amber-500" />
                    <span>
                      Đơn tối thiểu{" "}
                      <b className="text-[#ef476f]">{minSpentText}</b>; mỗi
                      khách tối đa{" "}
                      <b className="text-[#ef476f]">
                        {promotion.usageLimitPerUser}
                      </b>{" "}
                      lần.
                    </span>
                  </li>

                  {maxDiscountText && (
                    <li className="flex gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-slate-400" />
                      <span>Giảm tối đa: {maxDiscountText}.</span>
                    </li>
                  )}
                </ul>

                {/* CTA like image */}
                <div className="mt-6 rounded-2xl bg-[#2d2f38] text-white p-4 md:p-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold">
                      Dùng mã này tại quầy hoặc khi đặt online
                    </div>
                    <div className="text-sm text-white/70 mt-1">
                      Nhập mã trước khi thanh toán để được áp dụng ưu đãi.
                    </div>
                  </div>

                  <div className="shrink-0 rounded-xl bg-[#ef476f] px-5 py-3 font-extrabold">
                    {discountText}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom alert like image */}
          <div className="rounded-2xl border border-[#ef476f]/20 bg-[#fff0f4] p-4 flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-[#ef476f] text-white grid place-items-center font-bold">
              ⏱
            </div>
            <div>
              <div className="font-extrabold text-[#2b2b2b]">
                Chương trình sắp kết thúc!
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Nhanh tay sử dụng mã để nhận ưu đãi đặc biệt
              </div>

              <div className="text-xs text-gray-500 mt-2">
                Hiệu lực: {formatDateTime(promotion.startDate)} →{" "}
                {formatDateTime(promotion.endDate)}
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT */}
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          {/* Big image card */}
          <div className="relative overflow-hidden rounded-3xl bg-white shadow-sm border border-black/5">
            <div className="relative h-[360px] bg-[#ffe6ee]">
              {promoImage ? (
                <Image
                  src={promoImage}
                  alt={promotion.promotionName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 520px"
                  priority
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-sm text-gray-500">
                  Không có hình ảnh
                </div>
              )}

              {/* overlay badges */}
              <div className="absolute left-4 top-4 flex gap-2">
                <span className="rounded-full bg-emerald-600 text-white px-3 py-1 text-xs font-bold">
                  {statusText}
                </span>
                <span className="rounded-full bg-[#ef476f] text-white px-3 py-1 text-xs font-bold">
                  {discountText}
                </span>
              </div>

              {/* bottom overlay */}
              <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/60 via-black/10 to-transparent">
                <div className="text-white font-extrabold text-2xl line-clamp-2">
                  {promotion.promotionName}
                </div>
                <div className="mt-2 inline-flex rounded-full bg-white/20 text-white px-3 py-1 text-xs font-bold">
                  CODE {promotion.promotionCode}
                </div>
              </div>
            </div>
          </div>

          {/* Two small cards (reuse same image, không thêm dữ liệu mới) */}
          <div className="grid grid-cols-2 gap-5">
            <SmallVisualCard
              title={promotion.promotionName}
              priceText={discountText}
              image={promoImage}
            />
            <SmallVisualCard
              title={typeLabel(promotion.promotionType)}
              priceText={minSpentText}
              image={promoImage}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function SmallVisualCard({
  title,
  priceText,
  image,
}: {
  title: string;
  priceText: string;
  image: string | null;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-white shadow-sm border border-black/5 h-[220px]">
      <div className="absolute inset-0 bg-[#f7f7f7]">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
            sizes="240px"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-[11px] text-gray-500">
            Không có hình ảnh
          </div>
        )}
      </div>

      {/* pill top-right giống “25k” */}
      <div className="absolute right-3 top-3 rounded-full bg-[#ef476f] text-white px-3 py-1 text-xs font-extrabold shadow">
        {priceText}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/55 via-black/10 to-transparent">
        <div className="text-white font-extrabold line-clamp-1">{title}</div>
        <div className="text-white/90 text-xl md:text-2xl font-extrabold mt-1 line-clamp-1">
          {priceText}
        </div>
      </div>
    </div>
  );
}

function extractIdFromSlug(slug?: string) {
  if (!slug) return null;
  const last = slug.split("-").pop();
  return last && /^\d+$/.test(last) ? last : null;
}
