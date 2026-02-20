"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Gift,
  ShoppingBag,
  Star,
  Package,
  TrendingUp,
  Clock,
  ChevronRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";

interface Notification {
  id: number;
  type: "order" | "promotion" | "rank" | "system";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Mock notifications
const mockNewsNotifications: Notification[] = [
  {
    id: 1,
    type: "promotion",
    title: "Khuyến mãi đặc biệt!",
    message: "Giảm 20% cho tất cả đồ uống size L. Áp dụng từ hôm nay!",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
  },
  {
    id: 2,
    type: "rank",
    title: "Chúc mừng! Bạn đã lên hạng Bạc",
    message: "Bạn đã tích đủ điểm để lên hạng Bạc.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: false,
  },
  {
    id: 3,
    type: "promotion",
    title: "Voucher 50k cho bạn!",
    message: "Nhận ngay voucher giảm 50k cho đơn hàng từ 200k.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    read: true,
  },
];

const mockOrderNotifications: Notification[] = [
  {
    id: 4,
    type: "order",
    title: "Đơn hàng đã được giao",
    message: "Đơn hàng #12345 của bạn đã được giao thành công.",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    read: false,
  },
  {
    id: 5,
    type: "order",
    title: "Đơn hàng đang được chuẩn bị",
    message: "Đơn hàng #12344 đang được chuẩn bị. Dự kiến giao trong 30 phút.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    read: true,
  },
  {
    id: 6,
    type: "order",
    title: "Đơn hàng đã được xác nhận",
    message: "Đơn hàng #12343 đã được xác nhận và đang chờ xử lý.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    read: true,
  },
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "order":
      return <ShoppingBag className="w-4 h-4" />;
    case "promotion":
      return <Gift className="w-4 h-4" />;
    case "rank":
      return <Star className="w-4 h-4" />;
    default:
      return <Bell className="w-4 h-4" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case "order":
      return "bg-blue-100 text-blue-600";
    case "promotion":
      return "bg-pink-100 text-pink-600";
    case "rank":
      return "bg-amber-100 text-amber-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

export default function NotificationDropdown() {
  const [activeTab, setActiveTab] = useState<"news" | "orders">("news");
  const [mounted, setMounted] = useState(false);

  const currentNotifications =
    activeTab === "news" ? mockNewsNotifications : mockOrderNotifications;
  const unreadCount = currentNotifications.filter((n) => !n.read).length;

  // useEffect(() => {
  //     setMounted(true);
  // }, []);

  return (
    <div className="w-[380px] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header with Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab("news")}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors relative ${
              activeTab === "news"
                ? "text-[#00796B]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            TIN TỨC
            {activeTab === "news" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00796B]"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors relative ${
              activeTab === "orders"
                ? "text-[#00796B]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            ĐƠN HÀNG
            {activeTab === "orders" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00796B]"></div>
            )}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-[400px] overflow-y-auto">
        {currentNotifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Không có thông báo</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {currentNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                  !notification.read ? "bg-amber-50/30" : ""
                }`}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4
                        className={`text-sm font-semibold line-clamp-1 ${
                          !notification.read ? "text-gray-900" : "text-gray-700"
                        }`}
                      >
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>
                        {mounted
                          ? formatDistanceToNow(notification.timestamp, {
                              addSuffix: true,
                              locale: vi,
                            })
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3 bg-gray-50">
        <Link
          href="/notifications"
          className="flex items-center justify-center gap-2 text-sm font-medium text-[#00796B] hover:text-[#00695C] transition-colors"
        >
          Xem tất cả thông báo
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
