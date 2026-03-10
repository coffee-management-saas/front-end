"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Gift,
  ShoppingBag,
  Star,
  Check,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

type BackendNotification = {
  notificationId?: unknown;
  recipientId?: unknown;
  title?: unknown;
  message?: unknown;
  isRead?: unknown;
  referenceLink?: unknown;
  recipientType?: unknown;
  type?: unknown;
  shopId?: unknown;
  createdAt?: unknown;
};

type NotificationsApiResponse = {
  code?: unknown;
  status?: unknown;
  message?: unknown;
  data?: unknown;
  meta?: unknown;
};

interface Notification {
  id: number;
  type: "order" | "promotion" | "rank" | "system";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  icon?: React.ReactNode;
  color?: string;
  link?: string;
}

const safeNumber = (v: unknown) => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const deriveUiType = (raw: string) => {
  const t = raw.trim().toUpperCase();
  if (t.includes("ORDER")) return "order" as const;
  if (t.includes("PROMOTION") || t.includes("VOUCHER")) return "promotion" as const;
  if (t.includes("RANK") || t.includes("MEMBER")) return "rank" as const;
  return "system" as const;
};

const parseBackendRow = (row: unknown): Notification | null => {
  if (!row || typeof row !== "object") return null;
  const r = row as BackendNotification;

  const id = Math.floor(safeNumber(r.notificationId));
  const title = String(r.title ?? "").trim();
  const message = String(r.message ?? "").trim();
  const rawType = String(r.type ?? "").trim();
  const createdAtRaw = String(r.createdAt ?? "").trim();
  const timestamp = createdAtRaw ? new Date(createdAtRaw) : new Date();
  const read = Boolean(r.isRead);
  const link = typeof r.referenceLink === "string" ? r.referenceLink : undefined;

  if (!id || !title) return null;

  return {
    id,
    type: rawType ? deriveUiType(rawType) : "system",
    title,
    message,
    timestamp: Number.isFinite(timestamp.getTime()) ? timestamp : new Date(),
    read,
    link,
  };
};

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    (async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const res = await fetch("/api/notifications?page=0&size=100", {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
          cache: "no-store",
        });

        const json = (await res
          .json()
          .catch(() => null)) as NotificationsApiResponse | null;

        if (res.status === 401) {
          throw new Error("Vui lòng đăng nhập để xem thông báo");
        }

        if (!res.ok || !json || Number(json.code) !== 200) {
          throw new Error(
            json?.message ? String(json.message) : "Load notifications failed",
          );
        }

        const items = Array.isArray(json.data)
          ? json.data.map(parseBackendRow).filter(Boolean)
          : [];

        if (!mounted) return;
        setNotifications(items as Notification[]);
      } catch (e) {
        if (!mounted) return;
        setLoadError(e instanceof Error ? e.message : "Load notifications failed");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const filteredNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const handleMarkAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );

    void fetch(`/api/notifications/${id}`, {
      method: "PUT",
      headers: { Accept: "application/json" },
      cache: "no-store",
      keepalive: true,
    }).catch(() => null);
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    const ids = notifications.filter((n) => !n.read).map((n) => n.id);
    void Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/notifications/${id}`, {
          method: "PUT",
          headers: { Accept: "application/json" },
          cache: "no-store",
          keepalive: true,
        }),
      ),
    );
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
          {isLoading ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
              <p className="text-sm text-gray-500">Đang tải thông báo...</p>
            </div>
          ) : loadError ? (
            <div className="bg-white rounded-xl p-6 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-red-600">{loadError}</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
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
            filteredNotifications
              .slice()
              .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
              .map((notification) => {
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
