export type OrderType = "ONLINE" | "OFFLINE" | "DELIVERY";

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
    customerId?: number;
    orderType: OrderType;
    promotionItemsId?: string;
    orderItems: OrderItemRequest[];
    protectedAt?: string;
    promotionCode?: string;
    paymentGateway?: string;
    returnUrl?: string;
    deliveryAddress?: string;
    latitude?: number;
    longitude?: number;
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
    productVariantId?: number;
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
    checkoutUrl?: string;
    paymentUrl?: string;
    redirectUrl?: string;
    orderCode?: string | number;
    paymentLinkId?: string;
    message?: string;
    orderItems?: OrderItemResponse[];
    shippingFee?: number;
    discountAmount?: number;
    deliveryAddress?: string;
}
