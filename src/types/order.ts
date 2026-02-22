export type OrderType = "ONLINE" | "OFFLINE";

// ---- Request types ----
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

// ---- Response types ----
export interface ToppingPerOrderItemResponse {
    toppingPerOrderItemId?: number;
    toppingName?: string;
    price?: number;
    quantity?: number;
}

export interface OrderItemResponse {
    orderItemId?: number;
    productName?: string;
    sizeName?: string;
    unitPrice?: number;
    quantity?: number;
    orderItemStatus?: string;
    toppingPerOrderItems?: ToppingPerOrderItemResponse[];
}

export interface OrderResponse {
    orderId: number;
    orderType?: OrderType;
    basePrice?: number;
    paidPrice?: number;
    orderStatus?: string;
    paymentGateway?: string;
    createdAt?: string;
    payUrl?: string;
    message?: string;
    orderItems?: OrderItemResponse[];
}
