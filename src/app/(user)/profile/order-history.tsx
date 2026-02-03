"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { getMyOrders, getOrderById } from "@/services/order.service";
import { OrderResponse } from "@/types/order";
import { useAppContext } from "@/app/AppProvider";
import { formatCurrency } from "@/lib/utils";
import { ShoppingBag, Calendar, CreditCard, ChevronRight, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function OrderHistory() {
    const { accessToken } = useAppContext();
    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        if (!accessToken) return;
        const fetchOrders = async () => {
            try {
                const data = await getMyOrders(accessToken);
                // Sort by ID desc or Date desc (assuming higher ID is newer)
                setOrders(data.sort((a, b) => b.orderId - a.orderId));
            } catch (error) {
                console.error("Failed to fetch orders:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [accessToken]);

    const handleViewDetail = async (orderId: number) => {
        setDetailLoading(true);
        try {
            const detail = await getOrderById(accessToken, orderId);
            setSelectedOrder(detail);
        } catch (error) {
            toast.error("Không thể tải chi tiết đơn hàng");
        } finally {
            setDetailLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-amber-700" /></div>;
    }

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <ShoppingBag className="w-16 h-16 mb-4 text-gray-300" />
                <p>Bạn chưa có đơn hàng nào.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Lịch sử đơn hàng</h3>
            <div className="space-y-3">
                {orders.map((order) => (
                    <div
                        key={order.orderId}
                        className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors cursor-pointer flex justify-between items-center group"
                        onClick={() => handleViewDetail(order.orderId)}
                    >
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900">#{order.orderId}</span>
                                <StatusBadge status={order.orderStatus} />
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {order.createdAt ? format(new Date(order.createdAt), "dd/MM/yyyy HH:mm", { locale: vi }) : "N/A"}
                                </span>
                                <span className="flex items-center gap-1">
                                    <CreditCard className="w-3 h-3" />
                                    {formatCurrency(order.paidPrice)}
                                </span>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-amber-700 transition-colors" />
                    </div>
                ))}
            </div>

            <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Chi tiết đơn hàng #{selectedOrder?.orderId}</DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin space-y-6">

                            {/* Status Section */}
                            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                <span className="text-sm text-gray-600">Trạng thái</span>
                                <StatusBadge status={selectedOrder.orderStatus} />
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500 mb-1">Ngày đặt</p>
                                    <p className="font-medium">
                                        {selectedOrder.createdAt ? format(new Date(selectedOrder.createdAt), "dd/MM/yyyy HH:mm", { locale: vi }) : "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500 mb-1">Thanh toán</p>
                                    <p className="font-medium uppercase">{selectedOrder.paymentGateway || "Tiền mặt"}</p>
                                </div>
                            </div>

                            {/* Items List */}
                            <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    Sản phẩm
                                </h4>
                                <div className="space-y-3">
                                    {selectedOrder.orderItems?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex gap-3 text-sm border-b border-gray-50 pb-3 last:border-0">
                                            <div className="h-10 w-10 bg-amber-50 rounded flex items-center justify-center text-amber-700 font-bold text-xs">
                                                x{item.quantity}
                                            </div>
                                            <div className="flex-1">
                                                {/* Assuming item structure, adjust if needed based on real API response */}
                                                <p className="font-medium text-gray-900">{item.productName || "Sản phẩm"}</p>
                                                <p className="text-xs text-gray-500">Size {item.size}</p>
                                                {/* Render toppings if available in item structure */}
                                            </div>
                                            <div className="font-medium">
                                                {formatCurrency((item.price || 0) * item.quantity)}
                                            </div>
                                        </div>
                                    ))}
                                    {(!selectedOrder.orderItems || selectedOrder.orderItems.length === 0) && (
                                        <p className="text-sm text-gray-500 italic">Không có thông tin chi tiết sản phẩm.</p>
                                    )}
                                </div>
                            </div>

                            {/* Total Section */}
                            <div className="border-t border-gray-100 pt-4 space-y-2">
                                <div className="flex justify-between font-bold text-lg text-amber-800">
                                    <span>Tổng cộng</span>
                                    <span>{formatCurrency(selectedOrder.paidPrice)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    let color = "bg-gray-100 text-gray-600";
    let label = status;

    switch (status) {
        case "PENDING":
        case "Chờ xử lý": // Fallback text matching
            color = "bg-yellow-100 text-yellow-700";
            label = "Đang xử lý";
            break;
        case "PAID":
        case "Thành công":
            color = "bg-green-100 text-green-700";
            label = "Thành công";
            break;
        case "CANCELLED":
        case "Đã hủy":
            color = "bg-red-100 text-red-700";
            label = "Đã hủy";
            break;
        // Add more status mappings as needed
    }

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
            {label}
        </span>
    );
}
