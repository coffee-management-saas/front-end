"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  getOrderById,
  getOrderHistory,
  type OrderHistoryMeta,
} from "@/services/order.service";
import { OrderResponse } from "@/types/order";
import type {
  OrderItemResponse,
  ToppingPerOrderItemResponse,
} from "@/types/order";
import { useAppContext } from "@/app/AppProvider";
import { formatCurrency } from "@/lib/utils";
import {
  ShoppingBag,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";

export default function OrderHistory() {
  const { accessToken } = useAppContext();
  const PAGE_SIZE = 4;
  const [useClientPagination, setUseClientPagination] = useState(false);
  const [allOrders, setAllOrders] = useState<OrderResponse[]>([]);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [meta, setMeta] = useState<OrderHistoryMeta | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [orderDetails, setOrderDetails] = useState<
    Record<number, OrderResponse>
  >({});
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);
  const [profileAddress, setProfileAddress] = useState("");
  const [profilePhone, setProfilePhone] = useState("");

  useEffect(() => {
    setPage(0);
    setExpandedOrderId(null);
    setMeta(null);
    setOrders([]);
    setAllOrders([]);
    setUseClientPagination(false);
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    const fetchOrders = async () => {
      try {
        if (useClientPagination) return;
        setLoading(true);
        setExpandedOrderId(null);

        const profileRes = await fetch("/api/profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
          cache: "no-store",
        });
        const profilePayload: unknown = await profileRes
          .json()
          .catch(() => null);

        const p = unwrapEnvelope(profilePayload);

        const customerId = toNumber(p.customerId) || 2;
        setProfileAddress(toText(p.address));
        setProfilePhone(toText(p.phone));

        const payload = await getOrderHistory(
          accessToken,
          { page, size: PAGE_SIZE, customerId },
          { throwOnError: true },
        );

        // Sort by ID desc or Date desc (assuming higher ID is newer)
        const sorted = (payload.data ?? []).sort(
          (a, b) => b.orderId - a.orderId,
        );

        if (sorted.length > PAGE_SIZE) {
          setUseClientPagination(true);
          setAllOrders(sorted);
          setOrders([]);
          setMeta(null);
        } else {
          setOrders(sorted);
          setMeta(payload.meta ?? null);
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        toast.error("Không thể tải lịch sử đơn hàng");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [accessToken, page, PAGE_SIZE, useClientPagination]);

  const handleToggleDetail = async (orderId: number) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }

    setExpandedOrderId(orderId);

    if (orderDetails[orderId]) return;
    if (!accessToken) return;

    setDetailLoadingId(orderId);
    try {
      const detail = await getOrderById(accessToken, orderId);
      setOrderDetails((prev) => ({ ...prev, [orderId]: detail }));
    } catch (error) {
      toast.error("Không thể tải chi tiết đơn hàng");
    } finally {
      setDetailLoadingId((prev) => (prev === orderId ? null : prev));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-amber-700" />
      </div>
    );
  }

  const totalElements = useClientPagination
    ? allOrders.length
    : (meta?.totalElements ?? orders.length);
  const derivedLastPage =
    totalElements > 0 ? Math.max(1, Math.ceil(totalElements / PAGE_SIZE)) : 1;
  const displayOrders = useClientPagination
    ? allOrders.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
    : orders;

  if (totalElements === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <ShoppingBag className="w-16 h-16 mb-4 text-gray-300" />
        <p>Bạn chưa có đơn hàng nào.</p>
      </div>
    );
  }

  if (displayOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <ShoppingBag className="w-16 h-16 mb-4 text-gray-300" />
        <p>Không có đơn hàng ở trang này.</p>
        {page > 0 && (
          <Button
            type="button"
            className="mt-4"
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPage((p) => Math.max(0, p - 1));
            }}
          >
            Quay lại
          </Button>
        )}
      </div>
    );
  }

  const canPrev = page > 0;
  const lastPage = useClientPagination ? derivedLastPage : meta?.lastPage;
  const canNext = useClientPagination
    ? page + 1 < derivedLastPage
    : typeof lastPage === "number"
      ? page + 1 < lastPage
      : orders.length === PAGE_SIZE;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Lịch sử đơn hàng</h3>
          <p className="text-sm text-gray-500 mt-1">
            Bạn có {totalElements} đơn hàng
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {displayOrders.map((order) => {
          const isExpanded = expandedOrderId === order.orderId;
          const detail = orderDetails[order.orderId];
          const isDetailLoading = detailLoadingId === order.orderId;
          const previewItems = (
            detail?.orderItems ??
            order.orderItems ??
            []
          ).slice(0, 2);

          return (
            <div
              key={order.orderId}
              className="group relative bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-amber-200 transition-all duration-300 overflow-hidden"
            >
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-full -mr-16 -mt-16"></div>

              <div
                role="button"
                tabIndex={0}
                className="relative cursor-pointer outline-none"
                onClick={() => handleToggleDetail(order.orderId)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleToggleDetail(order.orderId);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Mã đơn hàng</p>
                    <p className="mt-1 truncate text-base font-bold text-gray-900">
                      DH-{order.orderId}
                    </p>
                  </div>
                  <StatusBadge status={order.orderStatus} />
                </div>

                {/* {previewItems.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {previewItems.map(
                      (item: OrderItemResponse, idx: number) => (
                        <div
                          key={`${order.orderId}-preview-${idx}`}
                          className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                            <ShoppingBag className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {item.productName || "Sản phẩm"}
                            </p>
                            <p className="text-xs text-gray-500">
                              x{item.quantity ?? 0}
                            </p>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )} */}

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {order.createdAt
                        ? format(new Date(order.createdAt), "dd/MM/yyyy", {
                            locale: vi,
                          })
                        : "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-[#693916]">
                      {formatCurrency(Number(order.paidPrice ?? 0))}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-gray-400 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div
                className={`grid transition-all duration-300 ease-out ${
                  isExpanded
                    ? "grid-rows-[1fr] opacity-100 mt-4"
                    : "grid-rows-[0fr] opacity-0 mt-0"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="overflow-hidden">
                  <div className="border-t border-gray-100 pt-4 space-y-5">
                    {isDetailLoading && (
                      <div className="flex items-center justify-center py-6 text-gray-500">
                        <Loader2 className="animate-spin mr-2" />
                        Đang tải chi tiết đơn hàng...
                      </div>
                    )}

                    {!isDetailLoading && detail && (
                      <div className="space-y-6">
                        <p className="text-xs font-semibold tracking-widest text-gray-400">
                          SẢN PHẨM
                        </p>

                        <div className="space-y-4">
                          {detail.orderItems?.map((item, idx: number) => {
                            const itemRec = asRecord(item as unknown);
                            const quantity =
                              typeof item.quantity === "number"
                                ? item.quantity
                                : toNumber(itemRec.quantity);
                            const unitPrice =
                              typeof item.unitPrice === "number"
                                ? item.unitPrice
                                : toNumber(itemRec.price);
                            const sizeLabel = String(
                              item.sizeName ?? toText(itemRec.size),
                            ).trim();
                            const toppings = Array.isArray(
                              item.toppingPerOrderItems,
                            )
                              ? item.toppingPerOrderItems
                              : [];

                            return (
                              <div
                                key={`${detail.orderId}-item-${idx}`}
                                className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                                    <ShoppingBag className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate font-semibold text-gray-900">
                                      {item.productName || "Sản phẩm"}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      Số lượng: {quantity}
                                    </p>
                                    {sizeLabel && (
                                      <p className="text-xs text-gray-500">
                                        Size {sizeLabel}
                                      </p>
                                    )}
                                    {toppings.length > 0 && (
                                      <div className="mt-1 space-y-0.5">
                                        {toppings.map(
                                          (
                                            t: ToppingPerOrderItemResponse,
                                            tIdx: number,
                                          ) => (
                                            <p
                                              key={`${detail.orderId}-item-${idx}-topping-${tIdx}`}
                                              className="text-xs text-gray-500"
                                            >
                                              + {t.toppingName || "Topping"} x
                                              {t.quantity ?? 0}
                                            </p>
                                          ),
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="shrink-0 font-semibold text-gray-700">
                                  {formatCurrency(unitPrice * quantity)}
                                </div>
                              </div>
                            );
                          })}

                          {(!detail.orderItems ||
                            detail.orderItems.length === 0) && (
                            <p className="text-sm text-gray-500 italic">
                              Không có thông tin chi tiết sản phẩm.
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="rounded-xl bg-gray-50 p-4">
                            <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-gray-500">
                              <MapPin className="h-3.5 w-3.5" />
                              ĐỊA CHỈ
                            </div>
                            <p className="mt-2 text-sm text-gray-700">
                              {profileAddress || "—"}
                            </p>
                            {profilePhone && (
                              <p className="mt-1 text-xs text-gray-500">
                                {profilePhone}
                              </p>
                            )}
                          </div>

                          <div className="rounded-xl bg-gray-50 p-4">
                            <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-gray-500">
                              <CreditCard className="h-3.5 w-3.5" />
                              THANH TOÁN
                            </div>
                            <p className="mt-2 text-sm font-medium text-gray-700">
                              {detail.paymentGateway || "Tiền mặt"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                          <span className="text-sm text-gray-600">
                            Tổng tiền
                          </span>
                          <span className="text-xl font-bold text-amber-700">
                            {formatCurrency(
                              Number(detail.paidPrice ?? order.paidPrice ?? 0),
                            )}
                          </span>
                        </div>
                      </div>
                    )}

                    {!isDetailLoading && isExpanded && !detail && (
                      <p className="text-sm text-gray-500 italic">
                        Không có thông tin chi tiết.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Trang {page + 1}
          {typeof lastPage === "number" ? ` / ${lastPage}` : ""}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPage((p) => Math.max(0, p - 1));
            }}
            disabled={!canPrev}
          >
            <ChevronLeft className="h-4 w-4" />
            Trước
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPage((p) => p + 1);
            }}
            disabled={!canNext}
          >
            Sau
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object")
    return value as Record<string, unknown>;
  return {};
}

function unwrapEnvelope(value: unknown): Record<string, unknown> {
  const root = asRecord(value);
  const data = root.data;
  if (data && typeof data === "object") return asRecord(data);
  const payload = root.payload;
  if (payload && typeof payload === "object") return asRecord(payload);
  return root;
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function toText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function StatusBadge({ status }: { status?: string }) {
  const raw = String(status ?? "").trim();
  let color = "bg-gray-100 text-gray-600";
  let label = raw || "—";

  switch (raw) {
    case "PENDING":
    case "Chờ xử lý":
    case "PROCESSING":
    case "Đang xử lý":
      color = "bg-yellow-100 text-yellow-700";
      label = "Đang xử lý";
      break;
    case "PAID":
    case "Thành công":
    case "SUCCESS":
      color = "bg-green-100 text-green-700";
      label = "Thành công";
      break;
    case "DELIVERED":
    case "Đã giao":
      color = "bg-emerald-100 text-emerald-700";
      label = "Đã giao";
      break;
    case "CANCELLED":
    case "Đã hủy":
      color = "bg-red-100 text-red-700";
      label = "Đã hủy";
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${color}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
