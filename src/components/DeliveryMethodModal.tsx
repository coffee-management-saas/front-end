"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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

    // --- Google Maps state ---
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const addressInputRef = useRef<HTMLInputElement | null>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const mapRef = useRef<HTMLDivElement | null>(null);
    const googleMapInstanceRef = useRef<google.maps.Map | null>(null);
    const markerRef = useRef<google.maps.Marker | null>(null);

    // Load Google Maps script once
    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey || typeof window === "undefined") return;
        if (document.getElementById("google-maps-script")) return;

        const script = document.createElement("script");
        script.id = "google-maps-script";
        // Dùng bản stable 'weekly' và tiếng Việt
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=vi&v=weekly`;
        script.async = true;
        script.defer = true;

        script.onerror = () => {
            console.error("Lỗi: Không thể tải bản đồ Google Maps. Hãy kiểm tra lại API Key hoặc Billing.");
        };

        document.head.appendChild(script);
    }, []);

    // Initialize Autocomplete
    const initAutocomplete = useCallback(() => {
        if (!addressInputRef.current) return;
        if (typeof window === "undefined" || !window.google?.maps?.places) return;
        if (autocompleteRef.current) return; // Already initialized

        const ac = new window.google.maps.places.Autocomplete(
            addressInputRef.current,
            {
                componentRestrictions: { country: "vn" },
                fields: ["formatted_address", "geometry", "name"],
            }
        );

        ac.addListener("place_changed", () => {
            const place = ac.getPlace();
            if (!place.geometry?.location) return;

            const newLat = place.geometry.location.lat();
            const newLng = place.geometry.location.lng();
            const formattedAddress = place.formatted_address || place.name || "";

            setLat(newLat);
            setLng(newLng);
            setDeliveryAddress(formattedAddress);

            // Update map view
            if (googleMapInstanceRef.current) {
                googleMapInstanceRef.current.setCenter({ lat: newLat, lng: newLng });
                googleMapInstanceRef.current.setZoom(16);
                if (markerRef.current) {
                    markerRef.current.setPosition({ lat: newLat, lng: newLng });
                } else {
                    markerRef.current = new window.google.maps.Marker({
                        position: { lat: newLat, lng: newLng },
                        map: googleMapInstanceRef.current,
                        animation: window.google.maps.Animation.DROP,
                    });
                }
            }
        });

        autocompleteRef.current = ac;
    }, []);

    // init map & autocomplete when mapRef is available
    const initMap = useCallback((node: HTMLDivElement | null) => {
        mapRef.current = node;
        if (!node) return;

        const tryInit = () => {
            if (!window.google?.maps) {
                setTimeout(tryInit, 300);
                return;
            }

            if (!googleMapInstanceRef.current) {
                googleMapInstanceRef.current = new window.google.maps.Map(node, {
                    center: { lat: 10.7725, lng: 106.6981 },
                    zoom: 13,
                    disableDefaultUI: false,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                });

                // Add click listener to map
                googleMapInstanceRef.current.addListener("click", (e: google.maps.MapMouseEvent) => {
                    if (!e.latLng) return;
                    const clickedLat = e.latLng.lat();
                    const clickedLng = e.latLng.lng();

                    setLat(clickedLat);
                    setLng(clickedLng);

                    // Update marker
                    if (markerRef.current) {
                        markerRef.current.setPosition(e.latLng);
                    } else {
                        markerRef.current = new window.google.maps.Marker({
                            position: e.latLng,
                            map: googleMapInstanceRef.current!,
                        });
                    }

                    // Reverse Geocoding to get address
                    const geocoder = new window.google.maps.Geocoder();
                    geocoder.geocode({ location: e.latLng }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
                        if (status === window.google.maps.GeocoderStatus.OK && results?.[0]) {
                            setDeliveryAddress(results[0].formatted_address);
                        }
                    });
                });
            }

            initAutocomplete();
        };

        tryInit();
    }, [initAutocomplete]);

    // When input ref changes, wire autocomplete
    const addressInputElemRef = useCallback((node: HTMLInputElement | null) => {
        addressInputRef.current = node;
        if (node && window.google?.maps?.places) {
            initAutocomplete();
        }
    }, [initAutocomplete]);

    useEffect(() => {
        if (step === "delivery" && window.google?.maps?.places) {
            // Give a small delay for DOM to render
            setTimeout(() => {
                initAutocomplete();
            }, 100);
        }
    }, [step, initAutocomplete]);

    const handleReset = () => {
        setStep("select");
        setSelectedStore(null);
        setDeliveryAddress("");
        setLat(null);
        setLng(null);
        autocompleteRef.current = null;
        googleMapInstanceRef.current = null;
        markerRef.current = null;
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
        onSelectMethod("delivery", {
            address: deliveryAddress,
            latitude: lat,
            longitude: lng
        });
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
                                    ref={addressInputElemRef}
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

                        {/* Google Maps View */}
                        <div
                            ref={initMap}
                            className="w-full h-64 bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 shadow-inner"
                        />

                        {lat && lng && (
                            <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                Đã xác định vị trí: {lat.toFixed(6)}, {lng.toFixed(6)}
                            </p>
                        )}

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
