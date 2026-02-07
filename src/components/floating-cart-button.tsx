"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { CartModal } from "./cart-modal";
import { cn } from "@/lib/utils";

export function FloatingCartButton() {
    const [modalOpen, setModalOpen] = useState(false);
    const { totalItems } = useCart();

    return (
        <>
            <button
                onClick={() => setModalOpen(true)}
                className={cn(
                    "fixed bottom-8 right-8 z-40",
                    "w-16 h-16 rounded-full shadow-lg",
                    "bg-[#693916] hover:bg-amber-900",
                    "text-white",
                    "flex items-center justify-center",
                    "transition-all duration-300 hover:scale-110 active:scale-95"
                )}
                aria-label="Giỏ hàng"
            >
                <ShoppingCart className="w-8 h-8" data-cart-icon />
                {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-sm w-7 h-7 rounded-full flex items-center justify-center font-bold shadow-md">
                        {totalItems > 99 ? "99+" : totalItems}
                    </span>
                )}
            </button>

            <CartModal open={modalOpen} onOpenChange={setModalOpen} />
        </>
    );
}
