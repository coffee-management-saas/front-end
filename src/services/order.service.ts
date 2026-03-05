import envConfig from "@/config";
import { ApiError } from "@/lib/utils";
import type { CreateOrderRequest, OrderResponse } from "@/types/order";

export type OrderHistoryMeta = {
  currentPage: number;
  size: number;
  lastPage: number;
  totalElements: number;
};

export type OrderHistoryResponse = {
  code: number;
  status: string;
  message: string;
  data: OrderResponse[];
  meta?: OrderHistoryMeta;
};

async function parseJsonSafely<T>(res: Response): Promise<T> {
  const raw = await res.text();
  if (!raw) throw new ApiError("BE trả về rỗng", 502);

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new ApiError("BE trả về không phải JSON", 502, raw);
  }
}

function extractErrorMessage(input: unknown): string | null {
  const visited = new Set<unknown>();

  const walk = (value: unknown): string | null => {
    if (value == null) return null;
    if (visited.has(value)) return null;
    visited.add(value);

    if (typeof value === "string") {
      const msg = value.trim();
      if (!msg) return null;
      if (msg.toLowerCase() === "be error") return null;
      return msg;
    }

    if (typeof value !== "object") return null;

    const obj = value as Record<string, unknown>;

    if (typeof obj.message === "string") {
      const msg = obj.message.trim();
      if (msg && msg.toLowerCase() !== "be error") return msg;
    }

    return (
      walk(obj.payload) ??
      walk(obj.error) ??
      walk(obj.data) ??
      walk(obj.details) ??
      null
    );
  };

  return walk(input);
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
      extractErrorMessage(data) || "Create order failed",
      res.status,
      data,
    );
  }

  return data;
}

export async function createEmployeeOrder(
  accessToken: string,
  request: CreateOrderRequest,
): Promise<OrderResponse> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/employee/orders`;

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

  if (!res.ok) {
    console.error("DEBUG CreateEmployeeOrder Failed:", data);
    throw new ApiError(
      extractErrorMessage(data) || "Create employee order failed",
      res.status,
      data,
    );
  }

  return data;
}

export async function getMyOrders(
  accessToken: string,
  options?: { viaNextApi?: boolean; throwOnError?: boolean },
): Promise<OrderResponse[]> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const useNextApi = shouldUseNextApi(options);
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
    const message = extractErrorMessage(data) || "Failed to fetch orders";
    if (options?.throwOnError) {
      throw new ApiError(message, res.status, data);
    }
    console.warn("[getMyOrders] Request failed:", {
      status: res.status,
      message,
    });
    return [];
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
      extractErrorMessage(data) || "Failed to fetch order details";
    throw new ApiError(message, res.status, data);
  }

  return data as OrderResponse;
}

export async function getOrderHistory(
  accessToken: string,
  params: { page: number; size: number; customerId: number },
  options?: { viaNextApi?: boolean; throwOnError?: boolean },
): Promise<OrderHistoryResponse> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const useNextApi = shouldUseNextApi(options);
  const search = new URLSearchParams({
    page: String(params.page),
    size: String(params.size),
    customerId: String(params.customerId),
  });

  const beUrl = useNextApi
    ? `/api/orders/history?${search.toString()}`
    : `${base}/orders/history?${search.toString()}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    credentials: useNextApi ? "same-origin" : "omit",
    cache: "no-store",
  });

  const payload = await parseJsonSafely<OrderHistoryResponse>(res).catch(
    () => null,
  );

  if (!res.ok) {
    const message =
      extractErrorMessage(payload) || "Failed to fetch order history";
    if (options?.throwOnError) {
      throw new ApiError(message, res.status, payload);
    }
    return {
      code: res.status,
      status: "ERROR",
      message,
      data: [],
    };
  }

  return (
    payload ?? {
      code: 200,
      status: "OK",
      message: "",
      data: [],
    }
  );
}

export async function confirmCashPayment(
  accessToken: string,
  orderId: number,
): Promise<OrderResponse> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/orders/${orderId}/confirm-cash`;

  const res = await fetch(beUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorData = await parseJsonSafely<unknown>(res).catch(() => null);
    throw new ApiError(
      extractErrorMessage(errorData) || "Failed to confirm cash payment",
      res.status,
    );
  }

  return parseJsonSafely<OrderResponse>(res);
}

export async function confirmEmployeeCashPayment(
  accessToken: string,
  orderId: number,
): Promise<OrderResponse> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/employee/orders/${orderId}/confirm-cash`;

  const res = await fetch(beUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorData = await parseJsonSafely<unknown>(res).catch(() => null);
    throw new ApiError(
      extractErrorMessage(errorData) ||
        "Failed to confirm employee cash payment",
      res.status,
    );
  }

  return parseJsonSafely<OrderResponse>(res);
}

export async function initiatePayment(
  accessToken: string,
  orderId: number,
  returnUrl: string,
): Promise<OrderResponse> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/orders/${orderId}/initiate-payment?returnUrl=${encodeURIComponent(returnUrl)}`;

  const res = await fetch(beUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorData = await parseJsonSafely<unknown>(res).catch(() => null);
    throw new ApiError(
      extractErrorMessage(errorData) || "Khởi tạo thanh toán thất bại",
      res.status,
    );
  }

  return parseJsonSafely<OrderResponse>(res);
}

export async function initiateEmployeePayment(
  accessToken: string,
  orderId: number,
  returnUrl: string,
): Promise<OrderResponse> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/employee/orders/${orderId}/initiate-payment?returnUrl=${encodeURIComponent(returnUrl)}`;

  const res = await fetch(beUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorData = await parseJsonSafely<unknown>(res).catch(() => null);
    throw new ApiError(
      extractErrorMessage(errorData) || "Khởi tạo thanh toán thất bại",
      res.status,
    );
  }

  return parseJsonSafely<OrderResponse>(res);
}
