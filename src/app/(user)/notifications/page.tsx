"use client";

import { useState } from "react";
import {
  Bell,
  Gift,
  ShoppingBag,
  Star,
  TrendingUp,
  X,
  Check,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface Notification {
  id: number;
  type: "order" | "promotion" | "rank" | "system";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  icon?: React.ReactNode;
  color?: string;
}

// Mock notifications
const mockNotifications: Notification[] = [
  {
    id: 1,
    type: "order",
    title: "Đơn hàng đã được giao",
    message:
      "Đơn hàng #12345 của bạn đã được giao thành công. Cảm ơn bạn đã mua hàng!",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    read: false,
  },
  {
    id: 2,
    type: "promotion",
    title: "Khuyến mãi đặc biệt!",
    message:
      "Giảm 20% cho tất cả đồ uống size L. Áp dụng từ hôm nay đến hết tuần!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
  },
  {
    id: 3,
    type: "rank",
    title: "Chúc mừng! Bạn đã lên hạng Bạc",
    message:
      "Bạn đã tích đủ điểm để lên hạng Bạc. Hãy khám phá các ưu đãi mới dành cho bạn!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    read: true,
  },
  {
    id: 4,
    type: "order",
    title: "Đơn hàng đang được chuẩn bị",
    message:
      "Đơn hàng #12344 của bạn đang được chuẩn bị. Dự kiến giao trong 30 phút.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true,
  },
  {
    id: 5,
    type: "promotion",
    title: "Voucher 50k cho bạn!",
    message: "Nhận ngay voucher giảm 50k cho đơn hàng từ 200k. Mã: WELCOME50",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    read: true,
  },
  {
    id: 6,
    type: "system",
    title: "Cập nhật điều khoản sử dụng",
    message:
      "Chúng tôi đã cập nhật điều khoản sử dụng. Vui lòng xem lại để biết thêm chi tiết.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    read: true,
  },
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "order":
      return {
        icon: <ShoppingBag className="w-5 h-5" />,
        color: "bg-blue-100 text-blue-600",
      };
    case "promotion":
      return {
        icon: <Gift className="w-5 h-5" />,
        color: "bg-pink-100 text-pink-600",
      };
    case "rank":
      return {
        icon: <Star className="w-5 h-5" />,
        color: "bg-amber-100 text-amber-600",
      };
    case "system":
      return {
        icon: <Bell className="w-5 h-5" />,
        color: "bg-gray-100 text-gray-600",
      };
    default:
      return {
        icon: <Bell className="w-5 h-5" />,
        color: "bg-gray-100 text-gray-600",
      };
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] =
    useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const handleMarkAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDelete = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-10">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Bell className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
                <p className="text-sm text-gray-500">
                  {unreadCount > 0
                    ? `${unreadCount} thông báo chưa đọc`
                    : "Không có thông báo mới"}
                </p>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 font-medium transition-colors relative ${
                filter === "all"
                  ? "text-amber-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Tất cả
              {filter === "all" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600"></div>
              )}
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-2 font-medium transition-colors relative ${
                filter === "unread"
                  ? "text-amber-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Chưa đọc
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
              {filter === "unread" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600"></div>
              )}
            </button>
          </div>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="flex gap-3 mb-4">
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                variant="outline"
                size="sm"
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                <Check className="w-4 h-4 mr-2" />
                Đánh dấu tất cả đã đọc
              </Button>
            )}
            <Button
              onClick={handleClearAll}
              variant="outline"
              size="sm"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa tất cả
            </Button>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {filter === "unread"
                  ? "Không có thông báo chưa đọc"
                  : "Không có thông báo"}
              </h3>
              <p className="text-sm text-gray-500">
                {filter === "unread"
                  ? "Tất cả thông báo đã được đọc"
                  : "Bạn chưa có thông báo nào"}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const { icon, color } = getNotificationIcon(notification.type);

              return (
                <div
                  key={notification.id}
                  className={`bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all ${
                    !notification.read ? "border-l-4 border-amber-500" : ""
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}
                    >
                      {icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4
                          className={`font-semibold ${!notification.read ? "text-gray-900" : "text-gray-700"}`}
                        >
                          {notification.title}
                        </h4>
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                          aria-label="Xóa thông báo"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(notification.timestamp, {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </span>
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                          >
                            Đánh dấu đã đọc
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
