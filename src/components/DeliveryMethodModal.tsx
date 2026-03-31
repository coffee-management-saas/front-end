"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Truck, Store, MapPin, ChevronRight, ArrowLeft } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn, debounce } from "@/lib/utils";
import { useAppContext } from "@/app/AppProvider";
import { toast } from "sonner";

interface Store { id: number; name: string; address: string; phone: string; }

const STORES: Store[] = [
    { id: 1, name: "F&B Coffee - Quận 1", address: "123 Nguyễn Huệ, Quận 1, TP.HCM", phone: "028 1234 5678" },
    { id: 2, name: "F&B Coffee - Quận 3", address: "456 Võ Văn Tần, Quận 3, TP.HCM", phone: "028 8765 4321" },
    { id: 3, name: "F&B Coffee - Bình Thạnh", address: "789 Điện Biên Phủ, Bình Thạnh, TP.HCM", phone: "028 9999 8888" },
];

export function DeliveryMethodModal({ open, onClose, onSelectMethod }: { open: boolean; onClose: () => void; onSelectMethod: (method: "delivery" | "pickup", data?: any) => void; }) {
    const { accessToken } = useAppContext();
    const [step, setStep] = useState<"select" | "delivery" | "pickup">("select");
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [lat, setLat] = useState<number>(10.7725);
    const [lng, setLng] = useState<number>(106.6981);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const goongMapInstanceRef = useRef<any | null>(null);
    const markerRef = useRef<any | null>(null);
    const initializingRef = useRef(false);

    useEffect(() => {
        if (!open) return;
        setStep("select");
        const loadInitData = async () => {
            if (accessToken) {
                try {
                    const res = await fetch("/api/profile", { headers: { 'Authorization': `Bearer ${accessToken}` } });
                    if (res.ok) {
                        const profile = await res.json();
                        if (profile.address) setDeliveryAddress(profile.address);
                    }
                } catch (e) {}
            }
            const saved = localStorage.getItem("deliveryMethod");
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed.type === "delivery" && parsed.data) {
                        setDeliveryAddress(parsed.data.address || "");
                        if (parsed.data.latitude) setLat(parsed.data.latitude);
                        if (parsed.data.longitude) setLng(parsed.data.longitude);
                    }
                } catch (e) {}
            }
        };
        loadInitData();
    }, [open, accessToken]);

    const initMap = useCallback(() => {
        const maptilesKey = process.env.NEXT_PUBLIC_GOONG_MAP_KEY;
        const goongjs = (window as any).goongjs;
        if (!maptilesKey || !goongjs || !mapContainerRef.current || goongMapInstanceRef.current || initializingRef.current) return;

        initializingRef.current = true;
        try {
            goongjs.accessToken = maptilesKey;
            const map = new goongjs.Map({
                container: mapContainerRef.current,
                style: 'https://tiles.goong.io/assets/goong_map_web.json',
                center: [lng, lat],
                zoom: 15
            });

            goongMapInstanceRef.current = map;
            map.on('load', () => {
                initializingRef.current = false;
                map.resize(); // Ensure map fits container
                const marker = new goongjs.Marker({ draggable: true, anchor: 'bottom' })
                    .setLngLat([lng, lat])
                    .addTo(map);

                marker.on('dragend', async () => {
                    const pos = marker.getLngLat();
                    setLat(pos.lat); setLng(pos.lng);
                    try {
                        const res = await fetch(`/api/map/geocode?latlng=${pos.lat},${pos.lng}`);
                        const data = await res.json();
                        if (data.status === "OK" && data.results?.[0]) {
                            setDeliveryAddress(data.results[0].formatted_address);
                        }
                    } catch (e) {}
                });
                markerRef.current = marker;
            });
            // Also handle initialization errors
            map.on('error', (e: any) => {
                console.error("Goong Map error:", e);
                initializingRef.current = false;
            });
        } catch (err) { 
            console.error("Map initialization failed:", err);
            initializingRef.current = false; 
        }
    }, [lat, lng]);

    useEffect(() => {
        if (open && step === "delivery") {
            const timer = setInterval(() => {
                if ((window as any).goongjs && mapContainerRef.current) {
                    initMap(); 
                    clearInterval(timer);
                }
            }, 300);
            return () => clearInterval(timer);
        } else {
            // Clean up when not on delivery step or modal closed
            if (goongMapInstanceRef.current) {
                goongMapInstanceRef.current.remove();
                goongMapInstanceRef.current = null;
                markerRef.current = null;
                initializingRef.current = false;
            }
        }
    }, [open, step, initMap]);

    const fetchSuggestions = useMemo(() => debounce(async (input: string) => {
        if (input.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
        try {
            const res = await fetch(`/api/map/autocomplete?input=${encodeURIComponent(input)}`);
            const data = await res.json();
            setSuggestions(data.predictions || []); setShowSuggestions(true);
        } catch (e) {}
    }, 500), []);

    const handleSelectSuggestion = async (s: any) => {
        setDeliveryAddress(s.description); setShowSuggestions(false);
        try {
            const res = await fetch(`/api/map/place-detail?placeId=${s.place_id}`);
            const data = await res.json();
            if (data.status === "OK") {
                const { lat: nl, lng: ng } = data.result.geometry.location;
                setLat(nl); setLng(ng);
                if (goongMapInstanceRef.current) goongMapInstanceRef.current.flyTo({ center: [ng, nl], zoom: 16 });
                if (markerRef.current) markerRef.current.setLngLat([ng, nl]);
            }
        } catch (e) {}
    };

    const handleConfirmDelivery = async () => {
        if (!deliveryAddress.trim()) { toast.error("Vui lòng nhập địa chỉ"); return; }
        if (accessToken) {
            try {
                await fetch("/api/profile", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
                    body: JSON.stringify({ address: deliveryAddress }),
                });
            } catch (e) {}
        }
        const data = { address: deliveryAddress, latitude: lat, longitude: lng };
        onSelectMethod("delivery", data); onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] overflow-hidden flex flex-col p-0 rounded-[2rem] border-none shadow-2xl">
                <div className="p-4 border-b bg-stone-50">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-extrabold flex items-center gap-2 text-[#693916]">
                            <div className="p-1.5 bg-amber-100 rounded-lg"><Truck size={20} className="text-amber-700" /></div>
                            Phương thức nhận hàng
                        </DialogTitle>
                    </DialogHeader>
                </div>
                <div className="flex-1 overflow-y-auto p-5 scrollbar-hide bg-white">
                    {step === "select" && (
                        <div className="grid grid-cols-1 gap-4">
                            <button 
                                onClick={() => setStep("delivery")} 
                                className="relative overflow-hidden group w-full p-5 border-2 border-stone-100 rounded-3xl flex items-center gap-6 hover:border-amber-500 hover:bg-amber-50/50 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Truck size={100} />
                                </div>
                                <div className="p-4 bg-amber-500 rounded-2xl text-white shadow-lg shadow-amber-200 group-hover:rotate-6 transition-transform shrink-0">
                                    <Truck size={32} />
                                </div>
                                <div className="flex-1 space-y-1 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xl font-black text-stone-800">Giao hàng tận nơi</h4>
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-amber-700 uppercase tracking-tight bg-amber-100 px-2.5 py-0.5 rounded-full">
                                            <span>Freeship từ 100k</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-stone-500 leading-normal max-w-sm">Cà phê sẽ được mang đến tận nơi trong 15-30 phút.</p>
                                    <div className="flex items-center gap-1.5 text-amber-600 font-bold group-hover:translate-x-1.5 transition-transform text-xs pt-0.5">
                                        Chọn ngay <ChevronRight size={14} />
                                    </div>
                                </div>
                            </button>

                            <button 
                                onClick={() => setStep("pickup")} 
                                className="relative overflow-hidden group w-full p-5 border-2 border-stone-100 rounded-3xl flex items-center gap-6 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Store size={100} />
                                </div>
                                <div className="p-4 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-200 group-hover:rotate-6 transition-transform shrink-0">
                                    <Store size={32} />
                                </div>
                                <div className="flex-1 space-y-1 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xl font-black text-stone-800">Nhận tại cửa hàng</h4>
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-700 uppercase tracking-tight bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                            <span>Tiết kiệm thời gian</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-stone-500 leading-normal max-w-sm">Chuẩn bị sẵn món lấy ngay khi ghé qua cửa hàng.</p>
                                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold group-hover:translate-x-1.5 transition-transform text-xs pt-0.5">
                                        Chọn ngay <ChevronRight size={14} />
                                    </div>
                                </div>
                            </button>
                        </div>
                    )}
                    {step === "delivery" && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                            <button onClick={() => setStep("select")} className="group text-xs flex items-center gap-1.5 text-stone-400 hover:text-stone-800 transition-colors font-bold">
                                <ArrowLeft size={14} /> Quay lại
                            </button>
                            <div className="space-y-1.5 relative">
                                <label className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
                                    <MapPin size={16} className="text-amber-600" /> Địa chỉ giao hàng
                                </label>
                                <div className="relative">
                                    <input 
                                        type="text" value={deliveryAddress}
                                        onChange={(e) => { setDeliveryAddress(e.target.value); fetchSuggestions(e.target.value); }}
                                        placeholder="Nhập địa chỉ giao hàng..."
                                        className="w-full px-4 py-3 border-2 border-stone-100 rounded-xl focus:border-amber-500 bg-stone-50 outline-none transition-all focus:bg-white text-sm"
                                    />
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-stone-100 rounded-xl mt-1 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                                            {suggestions.map((s, idx) => (
                                                <button key={idx} onClick={() => handleSelectSuggestion(s)} className="w-full p-3 text-left hover:bg-amber-50 border-b border-stone-50 last:border-0 text-sm transition-colors flex items-center gap-2.5">
                                                    <MapPin size={12} className="text-stone-400 shrink-0" />
                                                    <span className="truncate">{s.description}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div ref={mapContainerRef} className="w-full h-80 bg-stone-100 rounded-2xl border-2 border-stone-100 overflow-hidden shadow-inner" />
                            <div className="pt-1">
                                <button onClick={handleConfirmDelivery} className="w-full py-4 bg-[#693916] text-white rounded-xl font-black text-lg hover:bg-amber-900 shadow-xl shadow-amber-900/20 active:scale-[0.98] transition-all">
                                    Xác nhận & Đặt hàng
                                </button>
                            </div>
                        </div>
                    )}
                    {step === "pickup" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <button onClick={() => setStep("select")} className="group text-sm flex items-center gap-2 text-stone-400 hover:text-stone-800 transition-colors font-bold">
                                <div className="p-1 rounded-full border border-stone-200 group-hover:border-stone-800 transition-colors"><ArrowLeft size={16} /></div> 
                                Quay lại lựa chọn
                            </button>
                            <div className="grid grid-cols-1 gap-4">
                                {STORES.map(s => (
                                    <button 
                                        key={s.id} 
                                        onClick={() => setSelectedStore(s)} 
                                        className={cn(
                                            "w-full p-6 border-2 rounded-2xl text-left transition-all flex items-center justify-between group", 
                                            selectedStore?.id === s.id 
                                                ? "border-emerald-500 bg-emerald-50 shadow-md" 
                                                : "border-stone-100 hover:border-stone-200 hover:bg-stone-50"
                                        )}
                                    >
                                        <div className="space-y-1">
                                            <h5 className={cn("text-lg font-bold transition-colors", selectedStore?.id === s.id ? "text-emerald-700" : "text-stone-800")}>{s.name}</h5>
                                            <p className="text-sm text-stone-500 flex items-center gap-1"><MapPin size={14} /> {s.address}</p>
                                        </div>
                                        <div className={cn(
                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                            selectedStore?.id === s.id ? "border-emerald-500 bg-emerald-500 text-white" : "border-stone-200"
                                        )}>
                                            {selectedStore?.id === s.id && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => { if (selectedStore) { onSelectMethod("pickup", { store: selectedStore }); onClose(); } }} 
                                disabled={!selectedStore} 
                                className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-lg disabled:bg-stone-200 disabled:shadow-none hover:bg-emerald-700 shadow-xl shadow-emerald-900/20 active:scale-[0.98] transition-all"
                            >
                                Xác nhận nhận tại: {selectedStore?.name || "..."}
                            </button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
