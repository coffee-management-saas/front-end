export type OrderType = "ONLINE" | "OFFLINE";

export interface ToppingItemRequest {
    toppingId: number;
    quantity: number;
}

export interface OrderItemRequest {
    productVariantId: number;
    quantity: number;
    toppingItems: ToppingItemRequest[];
}

export interface CreateOrderRequest {
    orderType: OrderType;
    promotionItemsId?: string;
    orderItems: OrderItemRequest[];
    protectedAt?: string;
    promotionCode?: string;
    paymentGateway?: string;
    returnUrl?: string;
}

export interface OrderResponse {
    orderId: number;
    orderType: OrderType;
    basePrice: number;
    paidPrice: number;
    orderStatus: string;
    createdAt: string;
    paymentGateway?: string;
    payUrl?: string; // For Momo if applicable
    message?: string; // In case of error
    orderItems?: any[]; // Allow any for now to hold item details
}
