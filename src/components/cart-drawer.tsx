"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { CartItemCard } from "./cart-item-card";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface CartDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
    const router = useRouter();
    const { items, updateQuantity, removeItem, totalPrice, totalItems } = useCart();

    const formatPrice = (price: number) => price.toLocaleString("vi-VN") + " ₫";

    const handleCheckout = () => {
        onOpenChange(false);
        router.push("/checkout");
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
                <SheetHeader>
                    <SheetTitle>Giỏ hàng của bạn</SheetTitle>
                    <SheetDescription>
                        {totalItems > 0
                            ? `Bạn có ${totalItems} sản phẩm trong giỏ hàng`
                            : "Giỏ hàng trống"}
                    </SheetDescription>
                </SheetHeader>

                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                        <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Giỏ hàng trống</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm
                        </p>
                        <Button onClick={() => onOpenChange(false)} variant="outline">
                            Tiếp tục mua sắm
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto py-4 space-y-3">
                            {items.map((item) => (
                                <CartItemCard
                                    key={item.id}
                                    item={item}
                                    onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
                                    onRemove={() => removeItem(item.id)}
                                />
                            ))}
                        </div>

                        <Separator />

                        <SheetFooter className="flex-col gap-3">
                            <div className="flex items-center justify-between text-base">
                                <span className="font-semibold">Tổng cộng:</span>
                                <span className="font-bold text-lg text-primary">
                                    {formatPrice(totalPrice)}
                                </span>
                            </div>

                            <Button
                                onClick={handleCheckout}
                                className="w-full"
                                size="lg"
                            >
                                Thanh toán
                            </Button>
                        </SheetFooter>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
