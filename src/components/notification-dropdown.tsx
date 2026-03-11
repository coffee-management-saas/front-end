"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Gift,
  ShoppingBag,
  Star,
  Clock,
  ChevronRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import { toast } from "sonner";
import { useAppContext } from "@/app/AppProvider";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

type UiNotificationType = "order" | "promotion" | "rank" | "system";

type UiNotification = {
  id: number;
  type: UiNotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
  recipientType?: string;
  recipientId?: number;
  rawType?: string;
};

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

type RecipientHint = { recipientType: string; recipientId: number };

const safeNumber = (v: unknown) => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getRoleFromAccessToken(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const rawRole =
    payload.role ??
    (Array.isArray(payload.roles) ? payload.roles[0] : null) ??
    (Array.isArray(payload.authorities) ? payload.authorities[0] : null);

  if (!rawRole) return null;

  const normalized = String(rawRole).toUpperCase();
  return normalized.startsWith("ROLE_") ? normalized.slice(5) : normalized;
}

function mapRoleToRecipientType(role: string | null): string | null {
  if (!role) return null;
  const r = role.toUpperCase();
  if (r === "USER" || r === "CUSTOMER") return "CUSTOMER";
  if (r === "SHOP") return "SHOP";
  if (r === "EMPLOYEE") return "EMPLOYEE";
  if (r === "SYSTEM") return "SYSTEM";
  return null;
}

function getRecipientIdFromPayload(
  payload: Record<string, unknown>,
  recipientType: string | null,
): number | null {
  const candidates: unknown[] = [
    payload.recipientId,
    payload.userId,
    payload.id,
    payload.accountId,
    payload.customerId,
    payload.employeeId,
    payload.systemId,
    payload.shopId,
    payload.sub,
  ];

  for (const c of candidates) {
    const n = Math.floor(safeNumber(c));
    if (n > 0) return n;
    if (typeof c === "string") {
      const parsed = Number(c);
      if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
    }
  }

  if (recipientType === "SHOP" && typeof payload.shopId === "number") {
    return Math.floor(payload.shopId);
  }

  return null;
}

function deriveUiType(rawType: string): UiNotificationType {
  const t = rawType.trim().toUpperCase();
  if (t.includes("ORDER")) return "order";
  if (t.includes("PROMOTION") || t.includes("VOUCHER")) return "promotion";
  if (t.includes("RANK") || t.includes("MEMBER")) return "rank";
  return "system";
}

function parseBackendRow(row: unknown): UiNotification | null {
  if (!row || typeof row !== "object") return null;
  const r = row as BackendNotification;

  const id = Math.floor(safeNumber(r.notificationId));
  const title = String(r.title ?? "").trim();
  const message = String(r.message ?? "").trim();
  const rawType = String(r.type ?? "").trim();
  const createdAtRaw = String(r.createdAt ?? "").trim();
  const recipientType = String(r.recipientType ?? "").trim();
  const recipientId = Math.floor(safeNumber(r.recipientId));

  if (!id || !title) return null;

  const timestamp = createdAtRaw ? new Date(createdAtRaw) : new Date();
  const read = Boolean(r.isRead);
  const link = typeof r.referenceLink === "string" ? r.referenceLink : undefined;

  return {
    id,
    type: rawType ? deriveUiType(rawType) : "system",
    title,
    message,
    timestamp: Number.isFinite(timestamp.getTime()) ? timestamp : new Date(),
    read,
    link,
    recipientType: recipientType || undefined,
    recipientId: recipientId || undefined,
    rawType: rawType || undefined,
  };
}

function parseNotificationsApi(json: NotificationsApiResponse | null): {
  items: UiNotification[];
  hint: RecipientHint | null;
} {
  const items: UiNotification[] = [];
  let hint: RecipientHint | null = null;

  if (!json || Number(json.code) !== 200 || !Array.isArray(json.data)) {
    return { items, hint };
  }

  for (const row of json.data) {
    const parsed = parseBackendRow(row);
    if (!parsed) continue;
    items.push(parsed);
    if (!hint && parsed.recipientType && parsed.recipientId) {
      hint = { recipientType: parsed.recipientType, recipientId: parsed.recipientId };
    }
  }

  return { items, hint };
}

const getNotificationIcon = (type: UiNotificationType) => {
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

const getNotificationColor = (type: UiNotificationType) => {
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

function getWsUrl(): string {
  const raw = String(process.env.NEXT_PUBLIC_API_ENDPOINT ?? "")
    .trim()
    .replace(/\/$/, "");
  const base = raw.endsWith("/api") ? raw.slice(0, -4) : raw;
  return `${base}/ws`;
}

export default function NotificationDropdown() {
  const { tokens } = useAppContext();
  const accessToken = tokens?.accessToken || "";

  const [activeTab, setActiveTab] = useState<"news" | "orders">("news");
  const [mounted, setMounted] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [recipientHint, setRecipientHint] = useState<RecipientHint | null>(null);
  const [notifications, setNotifications] = useState<UiNotification[]>([]);

  const stompRef = useRef<Client | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!hasSynced) return;
    window.dispatchEvent(
      new CustomEvent("notifications:unread", {
        detail: notifications.filter((n) => !n.read).length,
      }),
    );
  }, [hasSynced, mounted, notifications]);

  useEffect(() => {
    const onMarkRead = (ev: Event) => {
      const e = ev as CustomEvent<unknown>;
      const ids = Array.isArray(e.detail)
        ? e.detail
            .map((x) => Math.floor(safeNumber(x)))
            .filter((n) => Number.isInteger(n) && n > 0)
        : [];
      if (!ids.length) return;

      setNotifications((prev) => {
        const set = new Set(ids);
        return prev.map((n) => (set.has(n.id) ? { ...n, read: true } : n));
      });
    };

    window.addEventListener("notifications:mark-read", onMarkRead as EventListener);
    return () => {
      window.removeEventListener(
        "notifications:mark-read",
        onMarkRead as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    if (!accessToken) {
      setNotifications([]);
      setRecipientHint(null);
      setLoadError(null);
      setIsLoading(false);
      setHasSynced(true);
      return;
    }

    setHasSynced(false);
    const controller = new AbortController();
    let mountedLocal = true;

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

        if (!res.ok || !json || Number(json.code) !== 200) {
          throw new Error(json?.message ? String(json.message) : "Load notifications failed");
        }

        const parsed = parseNotificationsApi(json);
        if (!mountedLocal) return;
        setNotifications(parsed.items);
        setRecipientHint(parsed.hint);
        setHasSynced(true);
      } catch (e) {
        if (!mountedLocal) return;
        const msg = e instanceof Error ? e.message : "Load notifications failed";
        setLoadError(msg);
      } finally {
        if (mountedLocal) setIsLoading(false);
      }
    })();

    return () => {
      mountedLocal = false;
      controller.abort();
    };
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;

    const role = getRoleFromAccessToken(accessToken);
    const recipientTypeFromToken = mapRoleToRecipientType(role);
    const payload = decodeJwtPayload(accessToken) ?? {};
    const recipientIdFromToken = getRecipientIdFromPayload(payload, recipientTypeFromToken);

    const recipientType =
      recipientTypeFromToken || recipientHint?.recipientType || null;
    const recipientId =
      recipientIdFromToken || recipientHint?.recipientId || null;

    if (!recipientType || !recipientId) return;

    const wsUrl = getWsUrl();
    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,
      debug:
        process.env.NODE_ENV === "production"
          ? undefined
          : (str) => console.log("STOMP Debug:", str),
    });

    client.onConnect = () => {
      const destination = `/queue/notifications/${recipientType}/${recipientId}`;
      client.subscribe(destination, (message) => {
        if (!message.body) return;
        let row: unknown = null;
        try {
          row = JSON.parse(message.body) as unknown;
        } catch {
          return;
        }

        const parsed = parseBackendRow(row);
        if (!parsed) return;

        setNotifications((prev) => {
          const next = [parsed, ...prev];
          const byId = new Map<number, UiNotification>();
          for (const n of next) if (!byId.has(n.id)) byId.set(n.id, n);
          const list = Array.from(byId.values()).slice(0, 200);
          return list;
        });

        toast(parsed.title);
      });
    };

    client.onStompError = (frame) => {
      const msg = frame.headers?.message || "STOMP broker error";
      console.error("STOMP Error:", msg, frame.body);
    };

    stompRef.current = client;
    client.activate();

    return () => {
      stompRef.current = null;
      client.deactivate();
    };
  }, [accessToken, recipientHint?.recipientId, recipientHint?.recipientType]);

  const currentNotifications = useMemo(() => {
    const items = notifications.slice().sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return activeTab === "orders"
      ? items.filter((n) => n.type === "order")
      : items.filter((n) => n.type !== "order");
  }, [activeTab, notifications]);

  const unreadCount = useMemo(
    () => currentNotifications.filter((n) => !n.read).length,
    [currentNotifications],
  );

  const markAsRead = async (id: number) => {
    if (!accessToken) return;

    setNotifications((prev) => {
      return prev.map((n) => (n.id === id ? { ...n, read: true } : n));
    });

    const res = await fetch(`/api/notifications/${id}`, {
      method: "PUT",
      headers: { Accept: "application/json" },
      cache: "no-store",
      keepalive: true,
    }).catch(() => null);

    if (!res) return;
    const json = (await res.json().catch(() => null)) as unknown;

    const code =
      json && typeof json === "object" && "code" in json
        ? Number((json as Record<string, unknown>).code)
        : null;

    if (!res.ok || (code !== null && code !== 200)) {
      const msg =
        json && typeof json === "object" && "message" in json
          ? String((json as Record<string, unknown>).message)
          : "Không thể cập nhật trạng thái đã đọc";
      toast.error(msg);
    }
  };

  return (
    <div className="w-[380px] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
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
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00796B]" />
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
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00796B]" />
            )}
          </button>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {!accessToken ? (
          <div className="py-10 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Vui lòng đăng nhập để xem thông báo</p>
          </div>
        ) : isLoading ? (
          <div className="py-10 text-center">
            <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            <p className="text-sm text-gray-500">Đang tải thông báo...</p>
          </div>
        ) : loadError ? (
          <div className="p-4 text-sm text-red-600">{loadError}</div>
        ) : currentNotifications.length === 0 ? (
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
                onClick={() => {
                  if (!notification.read) void markAsRead(notification.id);
                  if (notification.link) {
                    window.location.assign(notification.link);
                  }
                }}
              >
                <div className="flex gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4
                        className={`text-sm font-semibold line-clamp-1 ${
                          !notification.read ? "text-gray-900" : "text-gray-700"
                        }`}
                        title={notification.rawType || undefined}
                      >
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1" />
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

      <div className="border-t border-gray-200 p-3 bg-gray-50">
        <Link
          href="/notifications"
          className="flex items-center justify-center gap-2 text-sm font-medium text-[#00796B] hover:text-[#00695C] transition-colors"
        >
          Xem tất cả thông báo
          <ChevronRight className="w-4 h-4" />
          {unreadCount ? (
            <span className="ml-1 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white">
              {unreadCount}
            </span>
          ) : null}
        </Link>
      </div>
    </div>
  );
}
