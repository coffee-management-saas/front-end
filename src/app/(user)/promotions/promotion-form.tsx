"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ShoppingCart, ChevronLeft, ChevronRight, X, Clock, Calendar, Tag, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Promotion } from "@/types/promotion";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const canUseImage = (url: string | undefined | null) => {
  if (!url) return false;

  return /^https?:\/\//.test(url) || url.startsWith("/");
};

const SubscriptionCards: React.FC = () => {
  const [cart, setCart] = useState(0);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [morningBoostOpen, setMorningBoostOpen] = useState(false);
  const [weekendSpecialOpen, setWeekendSpecialOpen] = useState(false);
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
      description: "Ưu đãi đặc biệt dành cho bạn",
    }));
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
            Khám phá những ưu đãi tuyệt vời dành riêng cho bạn. Đừng bỏ lỡ cơ hội thưởng thức cà phê chất lượng với giá ưu đãi!
          </p>
        </div>

        {/* Hero Banners */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          {/* Banner 1 */}
          <div className="group relative h-[320px] md:h-[400px] rounded-[2.5rem] overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 ring-1 ring-black/5">
            <Image
              src="/images/banner1.png"
              alt="Morning Boost Promotion"
              fill
              className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            {/* Animated Badge */}
            <div className="absolute top-6 right-6 animate-pulse">
              <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 rounded-full shadow-lg">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                  Limited Time
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-1 w-12 bg-amber-400 rounded-full"></div>
                  <span className="text-amber-200 text-sm font-semibold uppercase tracking-wider">
                    Khuyến Mãi Buổi Sáng
                  </span>
                </div>
                <h3 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                  Morning Boost
                </h3>
                <p className="text-white/90 text-base md:text-lg leading-relaxed max-w-md">
                  Khởi động ngày mới đầy năng lượng với ưu đãi <span className="font-bold text-amber-300">giảm 20%</span> cho toàn bộ menu cà phê từ 7:00 - 10:00 sáng.
                </p>
                <button
                  onClick={() => setMorningBoostOpen(true)}
                  className="mt-4 bg-white text-[#693916] px-6 py-3 rounded-full font-bold hover:bg-amber-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Xem Chi Tiết →
                </button>
              </div>
            </div>
          </div>

          {/* Banner 2 */}
          <div className="group relative h-[320px] md:h-[400px] rounded-[2.5rem] overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 ring-1 ring-black/5">
            <Image
              src="/images/banner2.png"
              alt="Weekend Special Promotion"
              fill
              className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            {/* Animated Badge */}
            <div className="absolute top-6 right-6 animate-pulse">
              <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-4 py-2 rounded-full shadow-lg">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                  Weekend Only
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-1 w-12 bg-green-400 rounded-full"></div>
                  <span className="text-green-200 text-sm font-semibold uppercase tracking-wider">
                    Ưu Đãi Cuối Tuần
                  </span>
                </div>
                <h3 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                  Buy 1 Get 1
                </h3>
                <p className="text-white/90 text-base md:text-lg leading-relaxed max-w-md">
                  Cuối tuần thảnh thơi cùng bạn bè. <span className="font-bold text-green-300">Mua 1 tặng 1</span> áp dụng cho các dòng trà trái cây và đồ uống giải khát.
                </p>
                <button
                  onClick={() => setWeekendSpecialOpen(true)}
                  className="mt-4 bg-white text-[#693916] px-6 py-3 rounded-full font-bold hover:bg-green-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Xem Chi Tiết →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Divider */}
        <div className="flex items-center gap-4 mb-12">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent"></div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-400"></div>
            <h2 className="text-2xl font-bold text-[#693916] uppercase tracking-[0.15em]">
              Tất Cả Ưu Đãi
            </h2>
            <div className="w-2 h-2 rounded-full bg-amber-400"></div>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent"></div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-amber-200 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-[#693916] border-t-transparent rounded-full animate-spin absolute top-0"></div>
            </div>
            <p className="mt-6 text-gray-500 font-medium">Đang tải khuyến mãi...</p>
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

        {/* Empty State */}
        {!loading && !error && itemsForUI.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              Chưa có khuyến mãi
            </h3>
            <p className="text-gray-400">
              Hiện tại chưa có chương trình khuyến mãi nào khác. Vui lòng quay lại sau!
            </p>
          </div>
        )}

        {/* Promotions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {itemsForUI.map((item, index) => {
            const slug = toPromotionSlug(item.name, item.id);
            return (
              <div
                key={item.id}
                className="group bg-white rounded-3xl shadow-md hover:shadow-2xl transition-all duration-500 flex flex-col overflow-hidden border border-amber-100/50 hover:border-amber-200 transform hover:-translate-y-2 cursor-pointer"
                onClick={() => handleViewPromotion(item.id, item.name)}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Card Image */}
                <div className="relative h-52 overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50">
                  {canUseImage(item.image) ? (
                    <Image
                      src={item.image as string}
                      alt={item.name}
                      fill
                      className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-2"
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <ShoppingCart className="w-12 h-12 text-amber-200 mb-3" />
                      <span className="text-sm font-semibold text-amber-300 uppercase tracking-wider">
                        F&B Promo
                      </span>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <div className="bg-white/95 backdrop-blur-sm text-[#693916] text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg border border-amber-100">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        ACTIVE
                      </span>
                    </div>
                  </div>

                  {/* Decorative Corner */}
                  <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-amber-400/20 to-transparent rounded-br-full"></div>
                </div>

                {/* Perforated Edge Effect */}
                <div className="h-6 bg-white relative">
                  <div className="absolute top-0 left-0 right-0 flex justify-around -mt-3">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 bg-[#F9F7F5] rounded-full border-2 border-white"
                      ></div>
                    ))}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-[#693916] transition-colors leading-tight">
                    {item.name}
                  </h3>

                  <p className="text-sm text-gray-500 mb-6 line-clamp-2 leading-relaxed flex-1">
                    Thưởng thức trọn vẹn hương vị với ưu đãi hấp dẫn này. Áp dụng cho đặt hàng trực tuyến và tại cửa hàng.
                  </p>

                  {/* Divider */}
                  <div className="border-t-2 border-dashed border-amber-100 pt-5 mt-auto">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                          Mã Khuyến Mãi
                        </span>
                        <code className="text-base font-mono font-bold text-[#693916] bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1.5 rounded-lg border-2 border-amber-200 border-dashed">
                          {item.code}
                        </code>
                      </div>

                      {/* Arrow Button */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#693916] to-[#876F60] text-white flex items-center justify-center shadow-lg group-hover:shadow-xl transform group-hover:rotate-45 transition-all duration-500 group-hover:scale-110">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="7" y1="17" x2="17" y2="7"></line>
                          <polyline points="7 7 17 7 17 17"></polyline>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        {!loading && itemsForUI.length > 0 && (
          <div className="mt-20 text-center bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-12 border border-amber-100">
            <h3 className="text-2xl md:text-3xl font-bold text-[#693916] mb-4">
              Không tìm thấy ưu đãi phù hợp?
            </h3>
            <p className="text-gray-600 mb-6 max-w-xl mx-auto">
              Đăng ký nhận thông báo để không bỏ lỡ các chương trình khuyến mãi mới nhất từ chúng tôi!
            </p>
            <button className="bg-[#693916] hover:bg-[#876F60] text-white font-bold px-8 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              Đăng Ký Ngay
            </button>
          </div>
        )}
      </main>

      {/* Morning Boost Modal */}
      <Dialog open={morningBoostOpen} onOpenChange={setMorningBoostOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-[#693916]">
                  Morning Boost
                </DialogTitle>
                <p className="text-sm text-amber-600 font-semibold">
                  Khuyến mãi buổi sáng
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Promotion Image */}
            <div className="relative h-64 rounded-2xl overflow-hidden">
              <Image
                src="/images/banner1.png"
                alt="Morning Boost"
                fill
                className="object-cover"
              />
            </div>

            {/* Discount Info */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200 border-dashed">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">%</span>
                </div>
                <h3 className="text-xl font-bold text-[#693916]">
                  Ưu đãi giảm 20%
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Áp dụng cho <span className="font-bold">toàn bộ menu cà phê</span> khi đặt hàng trong khung giờ vàng từ 7:00 - 10:00 sáng mỗi ngày.
              </p>
            </div>

            {/* Validity Period */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200">
                <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">
                    Thời gian áp dụng
                  </h4>
                  <p className="text-sm text-gray-600">
                    7:00 AM - 10:00 AM<br />
                    Hàng ngày
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
                    01/02/2026 - 28/02/2026
                  </p>
                </div>
              </div>
            </div>

            {/* How to Use */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Cách sử dụng
              </h4>
              <ol className="space-y-2 text-sm text-gray-700 ml-7">
                <li className="flex gap-2">
                  <span className="font-semibold min-w-[20px]">1.</span>
                  <span>Đặt hàng trực tuyến hoặc tại quầy trong khung giờ 7:00 - 10:00 sáng</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-[20px]">2.</span>
                  <span>Chọn bất kỳ sản phẩm cà phê nào từ menu</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-[20px]">3.</span>
                  <span>Giảm giá 20% sẽ được áp dụng tự động khi thanh toán</span>
                </li>
              </ol>
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-800">Điều khoản & Điều kiện</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="text-amber-600">•</span>
                  <span>Chỉ áp dụng cho menu cà phê, không áp dụng cho trà, nước ép và đồ ăn</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-600">•</span>
                  <span>Không áp dụng đồng thời với các chương trình khuyến mãi khác</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-600">•</span>
                  <span>Giảm giá tối đa 50.000đ cho mỗi đơn hàng</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-600">•</span>
                  <span>Áp dụng cho tất cả các chi nhánh</span>
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => {
                setMorningBoostOpen(false);
                router.push('/menu');
              }}
              className="w-full bg-gradient-to-r from-[#693916] to-[#876F60] hover:from-[#876F60] hover:to-[#693916] text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Đặt Hàng Ngay
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Weekend Special Modal */}
      <Dialog open={weekendSpecialOpen} onOpenChange={setWeekendSpecialOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-[#693916]">
                  Buy 1 Get 1 Free
                </DialogTitle>
                <p className="text-sm text-green-600 font-semibold">
                  Ưu đãi cuối tuần
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Promotion Image */}
            <div className="relative h-64 rounded-2xl overflow-hidden">
              <Image
                src="/images/banner2.png"
                alt="Weekend Special"
                fill
                className="object-cover"
              />
            </div>

            {/* Discount Info */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 border-dashed">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">1+1</span>
                </div>
                <h3 className="text-xl font-bold text-[#693916]">
                  Mua 1 Tặng 1
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Áp dụng cho <span className="font-bold">tất cả các dòng trà trái cây và đồ uống giải khát</span> vào thứ Bảy và Chủ Nhật hàng tuần.
              </p>
            </div>

            {/* Validity Period */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200">
                <Clock className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">
                    Thời gian áp dụng
                  </h4>
                  <p className="text-sm text-gray-600">
                    Cả ngày<br />
                    Thứ 7 & Chủ Nhật
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200">
                <Calendar className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">
                    Thời hạn khuyến mãi
                  </h4>
                  <p className="text-sm text-gray-600">
                    01/02/2026 - 28/02/2026
                  </p>
                </div>
              </div>
            </div>

            {/* How to Use */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Cách sử dụng
              </h4>
              <ol className="space-y-2 text-sm text-gray-700 ml-7">
                <li className="flex gap-2">
                  <span className="font-semibold min-w-[20px]">1.</span>
                  <span>Đặt hàng vào thứ Bảy hoặc Chủ Nhật</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-[20px]">2.</span>
                  <span>Chọn 2 sản phẩm trà trái cây hoặc đồ uống giải khát (cùng loại, cùng size)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-[20px]">3.</span>
                  <span>Chỉ tính tiền cho 1 sản phẩm, sản phẩm thứ 2 hoàn toàn miễn phí</span>
                </li>
              </ol>
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-800">Điều khoản & Điều kiện</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="text-green-600">•</span>
                  <span>Chỉ áp dụng cho trà trái cây và đồ uống giải khát</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">•</span>
                  <span>Hai sản phẩm phải cùng loại và cùng size</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">•</span>
                  <span>Không áp dụng đồng thời với các chương trình khuyến mãi khác</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">•</span>
                  <span>Mỗi khách hàng được áp dụng tối đa 3 lần trong một ngày</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">•</span>
                  <span>Áp dụng cho tất cả các chi nhánh</span>
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => {
                setWeekendSpecialOpen(false);
                router.push('/menu');
              }}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-emerald-600 hover:to-green-600 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Đặt Hàng Ngay
            </button>
          </div>
        </DialogContent>
      </Dialog>
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
