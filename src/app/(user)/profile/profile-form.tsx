"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  CreditCard,
  Heart,
  HelpCircle,
  MapPin,
  Pencil,
  ShoppingCart,
  Tag,
} from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import OrderHistory from "./order-history";
import MemberTier from "./member-tier";
import Favorites from "./favorites";

import { ProfileData } from "@/types/profile";

export default function ProfileForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState("personal-info");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    // Update URL without reloading
    const params = new URLSearchParams(searchParams);
    params.set("tab", id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [originalProfile, setOriginalProfile] = useState<ProfileData | null>(
    null,
  );
  const [profile, setProfile] = useState<ProfileData>({
    customerId: "",
    username: "",
    fullname: "",
    rankId: "",
    email: "",
    phone: "",
    address: "",
    dob: "",
    createdAt: "",
    updatedAt: "",
    status: "",
  });

  const inputClasses =
    "w-full px-4 py-3 border border-gray-200 text-gray-900 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed";

  const rankLabel = useMemo(() => {
    switch (profile.rankId) {
      case "1":
        return "Đồng";
      case "2":
        return "Bạc";
      case "3":
        return "Vàng";
      case "4":
        return "Kim Cương";
      default:
        return "Chưa xếp hạng";
    }
  }, [profile.rankId]);

  const menuItems = [
    {
      id: "personal-info",
      icon: CreditCard,
      label: "Thông tin cá nhân",
      color: "text-amber-600",
    },
    {
      id: "member",
      icon: CreditCard,
      label: "Khách hàng thành viên",
      color: "text-amber-600",
    },
    {
      id: "deals",
      icon: Tag,
      label: "Ưu đãi của tôi",
      color: "text-orange-600",
    },
    {
      id: "address",
      icon: MapPin,
      label: "Sổ địa chỉ",
      color: "text-amber-600",
    },
    {
      id: "orders",
      icon: ShoppingCart,
      label: "Lịch sử đơn hàng",
      color: "text-amber-600",
    },
    {
      id: "favorites",
      icon: Heart,
      label: "Sản phẩm yêu thích",
      color: "text-amber-600",
    },
    {
      id: "viewed",
      icon: Tag,
      label: "Sản phẩm đã xem",
      color: "text-amber-600",
    },
    {
      id: "support",
      icon: HelpCircle,
      label: "Trung tâm trợ giúp",
      color: "text-orange-600",
    },
  ];

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const res = await fetch("/api/profile", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          cache: "no-store",
        });

        const payload = await res.json();
        if (!res.ok) throw { status: res.status, payload };

        setProfile(payload);
        setOriginalProfile(payload);
      } catch (err) {
        console.error("Fetch /api/profile failed:", err);
      }
    };

    fetchRequest();
  }, []);

  const handleStartEdit = () => {
    setOriginalProfile(profile);
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (originalProfile) setProfile(originalProfile);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullname: profile.fullname,
          phone: profile.phone,
          address: profile.address,
          dob: profile.dob,
          email: profile.email,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw { status: res.status, data };

      setProfile(data);
      setOriginalProfile(data);
      setIsEditing(false);
    } catch (err) {
      console.error("Update profile failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex gap-4 p-4">
      {/* Sidebar giữ layout cũ */}
      <div className="w-80 bg-white border border-gray-200 rounded-lg p-4">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? "bg-amber-50 border-l-4 border-amber-700"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <span
                  className={`font-medium ${
                    activeTab === item.id ? "text-amber-700" : "text-gray-700"
                  }`}
                >
                  {item.label}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6">
          <form className="space-y-5">
            {activeTab === "personal-info" && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.08em] text-gray-500">
                      Thông tin cơ bản
                    </p>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {profile.fullname || "Khách hàng"}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                          disabled={isSaving}
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={handleSave}
                          className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-amber-600 hover:bg-amber-700 transition disabled:opacity-60"
                          disabled={isSaving}
                        >
                          {isSaving ? "Đang lưu..." : "Lưu"}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStartEdit}
                        className="h-10 w-10 inline-flex items-center justify-center rounded-full border border-amber-200 bg-white text-amber-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        aria-label="Chỉnh sửa thông tin"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900">
                      Username
                    </label>
                    <input
                      type="text"
                      value={profile.username}
                      onChange={(e) =>
                        handleInputChange("username", e.target.value)
                      }
                      className={inputClasses}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      value={profile.fullname}
                      onChange={(e) =>
                        handleInputChange("fullname", e.target.value)
                      }
                      className={inputClasses}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className={inputClasses}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      className={inputClasses}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900">
                      Địa chỉ
                    </label>
                    <input
                      type="text"
                      value={profile.address}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      className={inputClasses}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900">
                      Ngày sinh (dob)
                    </label>
                    <input
                      value={profile.dob}
                      onChange={(e) => handleInputChange("dob", e.target.value)}
                      className={inputClasses}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-900">
                      Hạng thành viên
                    </label>
                    <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-white flex items-center gap-3">
                      {profile.rankId === "1" && (
                        <>
                          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                            <span className="text-amber-700 font-bold text-sm">
                              🥉
                            </span>
                          </div>
                          <span className="font-semibold text-amber-700">
                            {rankLabel}
                          </span>
                        </>
                      )}
                      {profile.rankId === "2" && (
                        <>
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-bold text-sm">
                              🥈
                            </span>
                          </div>
                          <span className="font-semibold text-gray-600">
                            {rankLabel}
                          </span>
                        </>
                      )}
                      {profile.rankId === "3" && (
                        <>
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-yellow-600 font-bold text-sm">
                              🥇
                            </span>
                          </div>
                          <span className="font-semibold text-yellow-600">
                            {rankLabel}
                          </span>
                        </>
                      )}
                      {profile.rankId === "4" && (
                        <>
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-sm">
                              💎
                            </span>
                          </div>
                          <span className="font-semibold text-blue-600">
                            {rankLabel}
                          </span>
                        </>
                      )}
                      {!profile.rankId ||
                        (profile.rankId !== "1" &&
                          profile.rankId !== "2" &&
                          profile.rankId !== "3" &&
                          profile.rankId !== "4" && (
                            <span className="text-gray-500">{rankLabel}</span>
                          ))}
                      {profile.points !== undefined && (
                        <span className="ml-auto text-sm text-gray-500">
                          {profile.points.toLocaleString()} điểm
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "orders" && <OrderHistory />}
            {activeTab === "member" && <MemberTier />}
            {activeTab === "favorites" && <Favorites />}

            {/* Fallback for other tabs */}
            {activeTab !== "orders" &&
              activeTab !== "personal-info" &&
              activeTab !== "member" &&
              activeTab !== "favorites" && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <p>Tính năng đang được phát triển</p>
                </div>
              )}
          </form>
        </div>
      </div>
    </div>
  );
}
