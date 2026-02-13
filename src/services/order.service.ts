import envConfig from "@/config";
import { ApiError } from "@/lib/utils";
import type { CreateOrderRequest, OrderResponse } from "@/types/order";

async function parseJsonSafely<T>(res: Response): Promise<T> {
    const raw = await res.text();
    if (!raw) throw new ApiError("BE trả về rỗng", 502);

    try {
        return JSON.parse(raw) as T;
    } catch {
        throw new ApiError("BE trả về không phải JSON", 502, raw);
    }
}

export async function createOrder(
    accessToken: string,
    request: CreateOrderRequest,
): Promise<OrderResponse> {
    const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
    const beUrl = `${base}/orders`;

    const res = await fetch(beUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(request),
        cache: "no-store",
    });

    const data = await parseJsonSafely<OrderResponse>(res);

    // Backend returns the Order object directly on success, without 'code' field wrapper.
    if (!res.ok) {
        console.error("DEBUG CreateOrder Failed:", data);
        throw new ApiError(data?.message || "Create order failed", res.status, data);
    }

    return data;
}

export async function getMyOrders(accessToken: string): Promise<OrderResponse[]> {
    const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
    // Assuming endpoint is GET /orders/my-orders based on common patterns
    // If it fails, I'll need to debug.
    const beUrl = `${base}/orders/my-orders`;

    const res = await fetch(beUrl, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
    });

    if (!res.ok) {
        const errorData = await parseJsonSafely<any>(res).catch(() => null);
        throw new ApiError(errorData?.message || "Failed to fetch orders", res.status);
    }

    return parseJsonSafely<OrderResponse[]>(res);
}

export async function getOrderById(accessToken: string, orderId: number): Promise<OrderResponse> {
    const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
    const beUrl = `${base}/orders/${orderId}`;

    const res = await fetch(beUrl, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
    });

    if (!res.ok) {
        const errorData = await parseJsonSafely<any>(res).catch(() => null);
        throw new ApiError(errorData?.message || "Failed to fetch order details", res.status);
    }

    return parseJsonSafely<OrderResponse>(res);
}
