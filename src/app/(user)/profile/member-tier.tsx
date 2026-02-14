"use client";

import { useEffect, useState } from "react";
import { Crown, Star, TrendingUp, Gift, Sparkles } from "lucide-react";
import { useAppContext } from "@/app/AppProvider";

interface MemberTier {
    id: number;
    name: string;
    icon: React.ReactNode;
    color: string;
    bgGradient: string;
    minPoints: number;
    maxPoints: number;
    benefits: string[];
}

const memberTiers: MemberTier[] = [
    {
        id: 1,
        name: "Đồng",
        icon: <Crown className="w-8 h-8" />,
        color: "text-amber-700",
        bgGradient: "from-amber-100 to-amber-50",
        minPoints: 0,
        maxPoints: 1000,
        benefits: [
            "Tích điểm mỗi đơn hàng",
            "Ưu đãi sinh nhật",
            "Thông báo khuyến mãi sớm"
        ]
    },
    {
        id: 2,
        name: "Bạc",
        icon: <Star className="w-8 h-8" />,
        color: "text-gray-500",
        bgGradient: "from-gray-200 to-gray-50",
        minPoints: 1001,
        maxPoints: 5000,
        benefits: [
            "Tất cả quyền lợi hạng Đồng",
            "Giảm 5% mọi đơn hàng",
            "Miễn phí giao hàng đơn từ 200k",
            "Ưu tiên hỗ trợ khách hàng"
        ]
    },
    {
        id: 3,
        name: "Vàng",
        icon: <Sparkles className="w-8 h-8" />,
        color: "text-yellow-500",
        bgGradient: "from-yellow-200 to-yellow-50",
        minPoints: 5001,
        maxPoints: 15000,
        benefits: [
            "Tất cả quyền lợi hạng Bạc",
            "Giảm 10% mọi đơn hàng",
            "Miễn phí giao hàng toàn bộ đơn",
            "Tặng voucher 100k mỗi tháng",
            "Ưu tiên đặt hàng sản phẩm mới"
        ]
    },
    {
        id: 4,
        name: "Kim Cương",
        icon: <Gift className="w-8 h-8" />,
        color: "text-blue-500",
        bgGradient: "from-blue-200 to-blue-50",
        minPoints: 15001,
        maxPoints: 999999,
        benefits: [
            "Tất cả quyền lợi hạng Vàng",
            "Giảm 15% mọi đơn hàng",
            "Tặng voucher 200k mỗi tháng",
            "Quà tặng độc quyền",
            "Tham gia sự kiện VIP",
            "Chăm sóc khách hàng 24/7"
        ]
    }
];

export default function MemberTier() {
    const { accessToken } = useAppContext();
    const [currentPoints, setCurrentPoints] = useState(0);
    const [currentRankId, setCurrentRankId] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!accessToken) return;

        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/profile", {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    cache: "no-store",
                });

                const data = await res.json();
                if (res.ok) {
                    // Assuming the API returns rankId and points
                    setCurrentRankId(parseInt(data.rankId) || 1);
                    // Mock points for now - replace with actual API data
                    setCurrentPoints(data.points || 0);
                }
            } catch (error) {
                console.error("Failed to fetch profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [accessToken]);

    const currentTier = memberTiers.find(tier => tier.id === currentRankId) || memberTiers[0];
    const nextTier = memberTiers.find(tier => tier.id === currentRankId + 1);

    // Calculate progress percentage
    const progressPercentage = nextTier
        ? ((currentPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
        : 100;

    const pointsToNextTier = nextTier ? nextTier.minPoints - currentPoints : 0;

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Current Tier Card */}
            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${currentTier.bgGradient} p-6 shadow-lg`}>
                <div className="absolute top-0 right-0 opacity-10">
                    <div className="text-[200px] leading-none">{currentTier.icon}</div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`${currentTier.color}`}>
                                {currentTier.icon}
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Hạng hiện tại</p>
                                <h2 className="text-2xl font-bold text-gray-900">{currentTier.name}</h2>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600">Điểm tích lũy</p>
                            <p className="text-3xl font-bold text-gray-900">{currentPoints.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {nextTier && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-700">Tiến độ lên hạng {nextTier.name}</span>
                                <span className="font-semibold text-gray-900">
                                    {Math.min(progressPercentage, 100).toFixed(0)}%
                                </span>
                            </div>
                            <div className="relative h-3 bg-white/50 rounded-full overflow-hidden">
                                <div
                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600">
                                Còn <span className="font-bold text-amber-700">{pointsToNextTier.toLocaleString()} điểm</span> để lên hạng {nextTier.name}
                            </p>
                        </div>
                    )}

                    {!nextTier && (
                        <div className="flex items-center gap-2 text-amber-700 bg-white/50 px-4 py-2 rounded-lg">
                            <TrendingUp className="w-5 h-5" />
                            <span className="font-semibold">Bạn đã đạt hạng cao nhất! 🎉</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Current Tier Benefits */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-amber-600" />
                    Quyền lợi của bạn
                </h3>
                <ul className="space-y-3">
                    {currentTier.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-3">
                            <div className="mt-1 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-gray-700">{benefit}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* All Tiers Overview */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Tất cả hạng thành viên</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    {memberTiers.map((tier) => (
                        <div
                            key={tier.id}
                            className={`relative overflow-hidden rounded-xl border-2 p-4 transition-all ${tier.id === currentRankId
                                    ? 'border-amber-500 shadow-md'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className={tier.color}>
                                    {tier.icon}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{tier.name}</h4>
                                    <p className="text-xs text-gray-500">
                                        {tier.minPoints.toLocaleString()} - {tier.maxPoints === 999999 ? '∞' : tier.maxPoints.toLocaleString()} điểm
                                    </p>
                                </div>
                                {tier.id === currentRankId && (
                                    <span className="ml-auto px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                                        Hiện tại
                                    </span>
                                )}
                            </div>
                            <ul className="space-y-1 text-sm text-gray-600">
                                {tier.benefits.slice(0, 3).map((benefit, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <span className="text-amber-500 mt-0.5">•</span>
                                        <span className="line-clamp-1">{benefit}</span>
                                    </li>
                                ))}
                                {tier.benefits.length > 3 && (
                                    <li className="text-amber-600 font-medium">+{tier.benefits.length - 3} quyền lợi khác</li>
                                )}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
