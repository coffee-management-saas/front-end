"use client";
import React, { useState } from "react";
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

interface ProfileData {
  fullName: string;
  phone: string;
  gender: string;
  idCard: string;
  birthDate: string;
  email: string;
  city: string;
  district: string;
}

export default function ProfileForm() {
  const [activeTab, setActiveTab] = useState("personal-info");
  const [profile, setProfile] = useState<ProfileData>({
    fullName: "Nguyễn Thị Hồng Ngọc",
    phone: "0916693077",
    gender: "Nữ",
    idCard: "080304004817",
    birthDate: "2004-11-21",
    email: "nguyenngoccdh04@gmail.com",
    city: "TPHCM",
    district: "Long An",
  });

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
                  Họ & tên
                </label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) =>
                    handleInputChange("fullName", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500
 focus:border-transparent"
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
                  className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Giới tính
                </label>
                <select
                  value={profile.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-transparent appearance-none bg-white"
                >
                  <option value=""></option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Số CMND/CCCD
                </label>
                <input
                  type="text"
                  value={profile.idCard}
                  onChange={(e) => handleInputChange("idCard", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-transparent"
                />
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  value={profile.birthDate}
                  onChange={(e) =>
                    handleInputChange("birthDate", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-transparent"
                />
              </div>
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Tỉnh/Thành phố
                </label>
                <select
                  value={profile.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-transparent appearance-none bg-white"
                >
                  <option value=""></option>
                  <option value="hanoi">Hà Nội</option>
                  <option value="hcm">Hồ Chí Minh</option>
                  <option value="danang">Đà Nẵng</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Quận/Huyện
                </label>
                <select
                  value={profile.district}
                  onChange={(e) =>
                    handleInputChange("district", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-transparent appearance-none bg-white"
                >
                  <option value=""></option>
                  <option value="district1">Quận 1</option>
                  <option value="district2">Quận 2</option>
                  <option value="district3">Quận 3</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="button"
                className="px-8 py-3 bg-amber-700 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors"
              >
                Lưu thông tin
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
