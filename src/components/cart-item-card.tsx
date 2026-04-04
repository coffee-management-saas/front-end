"use client";

import { Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import type { CartItem } from "@/types/cart";
import { canUseImage, cn, FALLBACK_IMG } from "@/lib/utils";

interface CartItemCardProps {
    item: CartItem;
    onUpdateQuantity: (quantity: number) => void;
    onRemove: () => void;
}

export function CartItemCard({
    item,
    onUpdateQuantity,
    onRemove,
}: CartItemCardProps) {
    const imageSrc = canUseImage(item.productImage) ? item.productImage! : FALLBACK_IMG;
    const toppingTotal = item.toppings.reduce(
        (sum, t) => sum + t.price * t.quantity,
        0,
    );
    const itemPrice = (item.basePrice + toppingTotal) * item.quantity;

    const formatPrice = (price: number) => price.toLocaleString("vi-VN") + " ₫";

    return (
        <div className="flex gap-3 p-3 bg-card rounded-lg border border-border/50">
            <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0 bg-secondary/30">
                <Image
                    src={imageSrc}
                    alt={item.productName}
                    fill
                    className="object-cover"
                />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">
                            {item.productName} ({item.size})
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            {formatPrice(item.basePrice)}
                        </p>
                    </div>

                    <button
                        onClick={onRemove}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        aria-label="Xóa"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {item.toppings.length > 0 && (
                    <div className="mt-1 text-xs text-muted-foreground">
                        {item.toppings.map((t) => (
                            <div key={t.id}>
                                + {t.name} x{t.quantity} ({formatPrice(t.price * t.quantity)})
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onUpdateQuantity(item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className={cn(
                                "w-6 h-6 rounded border flex items-center justify-center transition-colors",
                                item.quantity <= 1
                                    ? "bg-secondary text-muted-foreground border-border cursor-not-allowed"
                                    : "bg-primary text-primary-foreground border-primary hover:bg-primary/90",
                            )}
                        >
                            <Minus className="w-3 h-3" />
                        </button>

                        <span className="text-sm font-medium w-6 text-center">
                            {item.quantity}
                        </span>

                        <button
                            onClick={() => onUpdateQuantity(item.quantity + 1)}
                            className="w-6 h-6 rounded border border-primary bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>

                    <p className="text-sm font-bold text-primary">{formatPrice(itemPrice)}</p>
                </div>
            </div>
        </div>
    );
}
