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

function authHeaders(accessToken?: string): Record<string, string> {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

function shouldUseNextApi(options?: { viaNextApi?: boolean }) {
  if (typeof options?.viaNextApi === "boolean") {
    return options.viaNextApi;
  }
  return typeof window !== "undefined";
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
    throw new ApiError(
      data?.message || "Create order failed",
      res.status,
      data,
    );
  }

  return data;
}

export async function getMyOrders(
  accessToken: string,
): Promise<OrderResponse[]> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const useNextApi = shouldUseNextApi();
  const beUrl = useNextApi ? "/api/orders" : `${base}/orders/my-orders`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    credentials: useNextApi ? "same-origin" : "omit",
    cache: "no-store",
  });

  const data = await parseJsonSafely<OrderResponse[]>(res).catch(() => null);

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as { message?: unknown }).message)
        : "Failed to fetch orders";
    throw new ApiError(message, res.status, data);
  }

  return (data ?? []) as OrderResponse[];
}

export async function getOrderById(
  accessToken: string,
  orderId: number,
): Promise<OrderResponse> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const useNextApi = shouldUseNextApi();
  const beUrl = useNextApi
    ? `/api/orders/${orderId}`
    : `${base}/orders/${orderId}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    credentials: useNextApi ? "same-origin" : "omit",
    cache: "no-store",
  });

  const data = await parseJsonSafely<OrderResponse>(res).catch(() => null);

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as { message?: unknown }).message)
        : "Failed to fetch order details";
    throw new ApiError(message, res.status, data);
  }

  return data as OrderResponse;
}
