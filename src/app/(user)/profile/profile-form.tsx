"use client";
import React, { useEffect, useState } from "react";
import {
  CreditCard,
  Heart,
  ShoppingCart,
  MapPin,
  Tag,
  HelpCircle,
  LogOut,
  ChevronRight,
} from "lucide-react";
import envConfig from "@/config";
import { useAppContext } from "@/app/AppProvider";

interface ProfileData {
  customerId: string;
  username: string;
  fullname: string;
  rankId: string;
  email: string;
  phone: string;
  dob: string;
  createdAt: string;
  updatedAt: string;
  status: string;
}

export default function ProfileForm() {
  const [activeTab, setActiveTab] = useState("personal-info");
  const [profile, setProfile] = useState<ProfileData>({
    customerId: "",
    username: "",
    fullname: "",
    rankId: "",
    email: "",
    phone: "",
    dob: "",
    createdAt: "",
    updatedAt: "",
    status: "",
  });

  const { sessionToken } = useAppContext();

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
      label: "Đơn hàng",
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
    { id: "logout", icon: LogOut, label: "Đăng xuất", color: "text-amber-600" },
  ];

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (!sessionToken) return;

    const fetchRequest = async () => {
      try {
        const res = await fetch(
          `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/customers/me`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionToken}`,
            },
          },
        );

        const payload = await res.json();
        if (!res.ok) throw { status: res.status, payload };

        // payload đúng format BE trả về
        setProfile({
          customerId: String(payload?.customerId ?? ""),
          username: String(payload?.username ?? ""),
          fullname: String(payload?.fullname ?? ""),
          rankId: String(payload?.rankId ?? ""),
          email: String(payload?.email ?? ""),
          phone: String(payload?.phone ?? ""),
          dob: String(payload?.dob ?? ""),
          createdAt: String(payload?.createdAt ?? ""),
          updatedAt: String(payload?.updatedAt ?? ""),
          status: String(payload?.status ?? ""),
        });

        console.log("customers/me:", payload);
      } catch (err) {
        console.error("Fetch /customers/me failed:", err);
      }
    };

    fetchRequest();
  }, [sessionToken]);

  return (
    <div className="flex gap-4 p-4">
      {/* Sidebar */}
      <div className="w-80 bg-white border border-gray-200 rounded-lg p-4 ">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
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
      <div className="flex-1 pl-8 pr-8 pb-12 bg-white border border-gray-200 rounded-lg">
        <div className="p-4">
          <h2 className="text-2xl text-amber-700 mb-6">Thông tin cá nhân</h2>

          <form className="space-y-6">
            {/* Row 1 */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={profile.username}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 text-black rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Fullname
                </label>
                <input
                  type="text"
                  value={profile.fullname}
                  onChange={(e) =>
                    handleInputChange("fullname", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 text-black rounded-lg"
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Ngày sinh (dob)
                </label>
                <input
                  value={profile.dob}
                  onChange={(e) => handleInputChange("dob", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 text-black rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 text-black rounded-lg"
                />
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 text-black rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={profile.fullname}
                  onChange={(e) =>
                    handleInputChange("fullname", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 text-black rounded-lg"
                />
              </div>
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Hạng thành viên
                </label>
                <input
                  type="text"
                  value={
                    profile.rankId === "1"
                      ? "Đồng"
                      : profile.rankId === "2"
                        ? "Bạc"
                        : profile.rankId === "3"
                          ? "Vàng"
                          : "Chưa xác định"
                  }
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 text-black rounded-lg cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                className="px-8 py-3 text-sm bg-amber-700 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors"
              >
                Chỉnh sửa thông tin
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
