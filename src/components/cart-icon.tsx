"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

interface CartIconProps {
    onClick?: () => void;
    className?: string;
}

export function CartIcon({ onClick, className }: CartIconProps) {
    const { totalItems } = useCart();

    return (
        <button
            onClick={onClick}
            className={cn(
                "relative p-2 rounded-full hover:bg-accent transition-colors",
                className,
            )}
            aria-label="Giỏ hàng"
        >
            <ShoppingCart className="w-6 h-6" />
            {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {totalItems > 99 ? "99+" : totalItems}
                </span>
            )}
        </button>
    );
}
