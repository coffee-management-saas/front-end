"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { CartItem, CartContextType } from "@/types/cart";

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "coffee-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);

    // Load cart from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as CartItem[];
                setItems(parsed);
            } catch (e) {
                console.error("Failed to parse cart from localStorage", e);
            }
        }
        setIsHydrated(true);
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
        }
    }, [items, isHydrated]);

    const addItem = (item: Omit<CartItem, "id">) => {
        const id = `${item.productId}-${item.size}-${Date.now()}`;
        const newItem: CartItem = { ...item, id };
        setItems((prev) => [...prev, newItem]);
    };

    const removeItem = (itemId: string) => {
        setItems((prev) => prev.filter((item) => item.id !== itemId));
    };

    const updateQuantity = (itemId: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(itemId);
            return;
        }
        setItems((prev) =>
            prev.map((item) => (item.id === itemId ? { ...item, quantity } : item)),
        );
    };

    const clearCart = () => {
        setItems([]);
    };

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    const totalPrice = items.reduce((sum, item) => {
        const sizeDelta = item.size === "M" ? -4000 : 0;
        const toppingTotal = item.toppings.reduce(
            (tSum, t) => tSum + t.price * t.quantity,
            0,
        );
        const itemPrice = (item.basePrice + sizeDelta + toppingTotal) * item.quantity;
        return sum + itemPrice;
    }, 0);

    const value: CartContextType = {
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
