export interface CartTopping {
    id: number;
    name: string;
    price: number;
    quantity: number;
}

export interface CartItem {
    id: string; // unique cart item ID (productId-size-timestamp)
    productId: number;
    productName: string;
    productImage: string | null | undefined;
    variantId: number;
    size: string;
    basePrice: number;
    quantity: number;
    toppings: CartTopping[];
    // Additional customization
    iceLevel?: string;
    teaLevel?: string;
}

export interface CartContextType {
    items: CartItem[];
    addItem: (item: Omit<CartItem, "id">) => void;
    removeItem: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    clearCart: () => void;
    totalItems: number;
    totalPrice: number;
}
