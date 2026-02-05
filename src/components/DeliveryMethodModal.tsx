"use client";

import { useState } from "react";
import { X, Truck, Store, MapPin, Clock, Phone, ChevronRight } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Store {
    id: number;
    name: string;
    address: string;
    phone: string;
    hours: string;
    distance?: string;
}

const STORES: Store[] = [
    {
        id: 1,
        name: "F&B Coffee - Chi nhánh Quận 1",
        address: "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
        phone: "028 1234 5678",
        hours: "7:00 - 22:00",
        distance: "1.2 km",
    },
    {
        id: 2,
        name: "F&B Coffee - Chi nhánh Quận 3",
        address: "456 Võ Văn Tần, Phường 5, Quận 3, TP.HCM",
        phone: "028 8765 4321",
        hours: "7:00 - 22:00",
        distance: "2.5 km",
    },
    {
        id: 3,
        name: "F&B Coffee - Chi nhánh Bình Thạnh",
        address: "789 Điện Biên Phủ, Phường 15, Bình Thạnh, TP.HCM",
        phone: "028 9999 8888",
        hours: "6:30 - 23:00",
        distance: "3.8 km",
    },
];

interface DeliveryMethodModalProps {
    open: boolean;
    onClose: () => void;
    onSelectMethod: (method: "delivery" | "pickup", data?: any) => void;
}

export function DeliveryMethodModal({
    open,
    onClose,
    onSelectMethod,
}: DeliveryMethodModalProps) {
    const [step, setStep] = useState<"select" | "delivery" | "pickup">("select");
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);
    const [deliveryAddress, setDeliveryAddress] = useState("");

    const handleReset = () => {
        setStep("select");
        setSelectedStore(null);
        setDeliveryAddress("");
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    const handleSelectDelivery = () => {
        setStep("delivery");
    };

    const handleSelectPickup = () => {
        setStep("pickup");
    };

    const handleConfirmDelivery = () => {
        if (!deliveryAddress.trim()) {
            alert("Vui lòng nhập địa chỉ giao hàng");
            return;
        }
        onSelectMethod("delivery", { address: deliveryAddress });
        handleClose();
    };

    const handleConfirmPickup = () => {
        if (!selectedStore) {
            alert("Vui lòng chọn cửa hàng");
            return;
        }
        onSelectMethod("pickup", { store: selectedStore });
        handleClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-[#693916] flex items-center gap-2">
                        <Truck className="w-6 h-6" />
                        Chọn Phương Thức Nhận Hàng
                    </DialogTitle>
                </DialogHeader>

                {/* Step 1: Select Method */}
                {step === "select" && (
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-gray-600 mb-6">
                            Vui lòng chọn phương thức nhận hàng phù hợp với bạn
                        </p>

                        {/* Delivery Option */}
                        <button
                            onClick={handleSelectDelivery}
                            className="w-full p-6 border-2 border-gray-200 rounded-2xl hover:border-amber-500 hover:bg-amber-50 transition-all group text-left"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                    <Truck className="w-7 h-7 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#693916]">
                                        Giao Hàng Tận Nơi
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-3">
                                        Chúng tôi sẽ giao hàng đến địa chỉ của bạn
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            30-45 phút
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            Trong bán kính 5km
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-[#693916] group-hover:translate-x-1 transition-all" />
                            </div>
                        </button>

                        {/* Pickup Option */}
                        <button
                            onClick={handleSelectPickup}
                            className="w-full p-6 border-2 border-gray-200 rounded-2xl hover:border-green-500 hover:bg-green-50 transition-all group text-left"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                    <Store className="w-7 h-7 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-700">
                                        Nhận Tại Cửa Hàng
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-3">
                                        Đến cửa hàng để nhận hàng và tiết kiệm phí ship
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            15-20 phút
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Store className="w-4 h-4" />
                                            3 chi nhánh
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-green-700 group-hover:translate-x-1 transition-all" />
                            </div>
                        </button>
                    </div>
                )}

                {/* Step 2: Delivery Address */}
                {step === "delivery" && (
                    <div className="space-y-6 py-4">
                        <button
                            onClick={handleReset}
                            className="text-sm text-gray-600 hover:text-[#693916] flex items-center gap-1"
                        >
                            ← Quay lại
                        </button>

                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-3">
                                Địa chỉ giao hàng
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Nhập địa chỉ của bạn..."
                                    value={deliveryAddress}
                                    onChange={(e) => setDeliveryAddress(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none text-sm"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                💡 Tip: Bạn có thể chọn vị trí trên bản đồ hoặc nhập địa chỉ chi tiết
                            </p>
                        </div>

                        {/* Google Maps Placeholder */}
                        <div className="w-full h-64 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                            <div className="text-center">
                                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">
                                    Google Maps sẽ được tích hợp tại đây
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    (Cần API key để hiển thị bản đồ)
                                </p>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <h4 className="font-semibold text-sm text-gray-900 mb-2">
                                Thông tin giao hàng:
                            </h4>
                            <ul className="space-y-1 text-xs text-gray-600">
                                <li>• Phí ship: 15.000đ - 25.000đ (tùy khoảng cách)</li>
                                <li>• Thời gian giao: 30-45 phút</li>
                                <li>• Miễn phí ship cho đơn hàng từ 200.000đ</li>
                            </ul>
                        </div>

                        <button
                            onClick={handleConfirmDelivery}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all"
                        >
                            Xác Nhận Địa Chỉ Giao Hàng
                        </button>
                    </div>
                )}

                {/* Step 3: Select Store for Pickup */}
                {step === "pickup" && (
                    <div className="space-y-6 py-4">
                        <button
                            onClick={handleReset}
                            className="text-sm text-gray-600 hover:text-[#693916] flex items-center gap-1"
                        >
                            ← Quay lại
                        </button>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                Chọn cửa hàng để nhận hàng
                            </h3>
                            <p className="text-sm text-gray-600">
                                Đơn hàng sẽ được chuẩn bị trong 15-20 phút
                            </p>
                        </div>

                        {/* Store List */}
                        <div className="space-y-3">
                            {STORES.map((store) => (
                                <button
                                    key={store.id}
                                    onClick={() => setSelectedStore(store)}
                                    className={`w-full p-5 border-2 rounded-xl text-left transition-all ${selectedStore?.id === store.id
                                            ? "border-green-500 bg-green-50"
                                            : "border-gray-200 hover:border-green-300 hover:bg-green-50/50"
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedStore?.id === store.id
                                                    ? "bg-green-500"
                                                    : "bg-gray-200"
                                                }`}
                                        >
                                            <Store
                                                className={`w-5 h-5 ${selectedStore?.id === store.id
                                                        ? "text-white"
                                                        : "text-gray-600"
                                                    }`}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 mb-1">
                                                {store.name}
                                            </h4>
                                            <div className="space-y-1 text-xs text-gray-600">
                                                <p className="flex items-start gap-2">
                                                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                    <span>{store.address}</span>
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <Phone className="w-4 h-4" />
                                                    {store.phone}
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    {store.hours}
                                                </p>
                                            </div>
                                            {store.distance && (
                                                <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                                    📍 Cách bạn {store.distance}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <h4 className="font-semibold text-sm text-gray-900 mb-2">
                                Quy trình nhận hàng tại cửa hàng:
                            </h4>
                            <ol className="space-y-2 text-xs text-gray-600">
                                <li className="flex items-start gap-2">
                                    <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                                        1
                                    </span>
                                    <span>Đặt hàng và chọn cửa hàng muốn nhận</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                                        2
                                    </span>
                                    <span>
                                        Nhận thông báo khi đơn hàng đã sẵn sàng (qua SMS/Email)
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                                        3
                                    </span>
                                    <span>
                                        Đến cửa hàng, xuất trình mã đơn hàng và nhận sản phẩm
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                                        4
                                    </span>
                                    <span>
                                        Thanh toán tại quầy (nếu chưa thanh toán online)
                                    </span>
                                </li>
                            </ol>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <h4 className="font-semibold text-sm text-gray-900 mb-2">
                                ✨ Ưu điểm khi nhận tại cửa hàng:
                            </h4>
                            <ul className="space-y-1 text-xs text-gray-600">
                                <li>• Miễn phí hoàn toàn (không phí ship)</li>
                                <li>• Nhận hàng nhanh chóng (15-20 phút)</li>
                                <li>• Kiểm tra sản phẩm trực tiếp trước khi nhận</li>
                                <li>• Tích điểm thành viên khi nhận tại cửa hàng</li>
                            </ul>
                        </div>

                        <button
                            onClick={handleConfirmPickup}
                            disabled={!selectedStore}
                            className={`w-full py-4 rounded-xl font-bold transition-all ${selectedStore
                                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                }`}
                        >
                            {selectedStore
                                ? `Xác Nhận Nhận Tại ${selectedStore.name}`
                                : "Vui lòng chọn cửa hàng"}
                        </button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
