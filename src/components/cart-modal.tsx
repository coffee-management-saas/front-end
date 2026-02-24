"use client";

import { Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { canUseImage, FALLBACK_IMG } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface CartModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CartModal({ open, onOpenChange }: CartModalProps) {
    const router = useRouter();
    const { items, updateQuantity, removeItem, totalPrice, totalItems, clearCart } = useCart();

    const formatPrice = (price: number) => price.toLocaleString("vi-VN") + " ₫";

    const handleCheckout = () => {
        onOpenChange(false);
        router.push("/checkout");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4">
                    <DialogTitle className="text-2xl font-bold">Giỏ hàng của bạn</DialogTitle>
                    <DialogDescription>
                        {totalItems > 0
                            ? `Bạn có ${totalItems} sản phẩm trong giỏ hàng`
                            : "Giỏ hàng trống"}
                    </DialogDescription>
                </DialogHeader>

                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                        <div className="w-24 h-24 rounded-full bg-secondary/30 flex items-center justify-center mb-4">
                            <X className="w-12 h-12 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Giỏ hàng trống</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm
                        </p>
                        <Button onClick={() => onOpenChange(false)} variant="outline">
                            Tiếp tục mua sắm
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 px-6 max-h-[50vh] overflow-y-auto">
                            <div className="space-y-4 py-4">
                                {items.map((item) => {
                                    const sizeDelta = item.size === "M" ? -4000 : 0;
                                    const toppingTotal = item.toppings.reduce(
                                        (sum, t) => sum + t.price * t.quantity,
                                        0,
                                    );
                                    const itemPrice = (item.basePrice + sizeDelta + toppingTotal) * item.quantity;

                                    return (
                                        <div
                                            key={item.id}
                                            className="flex gap-4 p-4 bg-card rounded-lg border border-border/50 hover:border-border transition-colors"
                                        >
                                            <div className="relative w-24 h-24 rounded-md overflow-hidden flex-shrink-0 bg-secondary/30">
                                                {canUseImage(item.productImage) ? (
                                                    <Image
                                                        src={item.productImage!}
                                                        alt={item.productName}
                                                        fill
                                                        className="object-cover"
                                                        onError={(e) => {
                                                            const img = e.target as HTMLImageElement;
                                                            img.src = FALLBACK_IMG;
                                                        }}
                                                    />
                                                ) : (
                                                    <Image
                                                        src={FALLBACK_IMG}
                                                        alt={item.productName}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-base truncate">
                                                            {item.productName}
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            Size: {item.size}
                                                        </p>
                                                    </div>

                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                                        aria-label="Xóa"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>

                                                {item.toppings.length > 0 && (
                                                    <div className="mb-3 text-sm text-muted-foreground space-y-1">
                                                        {item.toppings.map((t) => (
                                                            <div key={t.id} className="flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                                                                <span>
                                                                    {t.name} x{t.quantity} (+{formatPrice(t.price * t.quantity)})
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 bg-secondary/50 rounded-lg p-1">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            disabled={item.quantity <= 1}
                                                            className="w-8 h-8 rounded-md flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-background"
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </button>

                                                        <span className="text-base font-semibold w-8 text-center">
                                                            {item.quantity}
                                                        </span>

                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-background transition-colors"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    <p className="text-lg font-bold text-[#693916]">
                                                        {formatPrice(itemPrice)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <Separator />

                        <DialogFooter className="px-6 py-4 flex-col gap-4 sm:flex-col">
                            <div className="flex items-center justify-between text-lg">
                                <span className="font-semibold">Tổng cộng:</span>
                                <span className="font-bold text-2xl text-[#693916]">
                                    {formatPrice(totalPrice)}
                                </span>
                            </div>

                            <div className="flex gap-3 w-full">
                                <Button
                                    onClick={() => clearCart()}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Xóa tất cả
                                </Button>
                                <Button
                                    onClick={handleCheckout}
                                    className="flex-1 bg-[#693916] hover:bg-amber-900"
                                    size="lg"
                                >
                                    Thanh toán
                                </Button>
                            </div>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
