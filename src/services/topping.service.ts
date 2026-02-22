// services/topping.service.ts

import envConfig from "@/config";
import { ApiError } from "@/lib/utils";
import type {
  ToppingDto,
  ToppingInput,
  ToppingResponse,
  ToppingsResponse,
} from "@/types/topping";

async function parseJsonSafely<T>(res: Response): Promise<T | null> {
  const raw = await res.text();
  if (!raw) return null;

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

export async function getToppings(params: {
  page: number;
  size: number;
  accessToken?: string;
  options?: { viaNextApi?: boolean };
}): Promise<ToppingsResponse> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const useNextApi = shouldUseNextApi(params.options);

  const qs = new URLSearchParams({
    page: String(params.page),
    size: String(params.size),
  });

  const beUrl = useNextApi
    ? `/api/products/toppings?${qs.toString()}`
    : `${base}/product/toppings?${qs.toString()}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(useNextApi ? {} : authHeaders(params.accessToken)),
    },
    credentials: useNextApi ? "same-origin" : "omit",
    cache: "no-store",
  });

  const data = await parseJsonSafely<ToppingsResponse>(res);

  if (!res.ok) {
    throw new ApiError("BE error", res.status, data);
  }

  if (!data || data.code !== 200) {
    throw new ApiError(data?.message || "Get toppings failed", 400, data);
  }

  return data;
}

export async function getToppingById(
  id: number | string,
  accessToken?: string,
  options?: { viaNextApi?: boolean },
): Promise<ToppingDto> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const useNextApi = shouldUseNextApi(options);
  const beUrl = useNextApi
    ? `/api/products/toppings/${id}`
    : `${base}/product/toppings/${id}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(useNextApi ? {} : authHeaders(accessToken)),
    },
    credentials: useNextApi ? "same-origin" : "omit",
    cache: "no-store",
  });

  const data = await parseJsonSafely<ToppingResponse>(res);

  if (!res.ok || !data || data.code < 200 || data.code >= 300) {
    throw new ApiError(data?.message || "Get topping failed", res.status, data);
  }

  return data.data;
}

export async function createTopping(
  payload: ToppingInput & { accessToken?: string },
): Promise<ToppingDto> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const useNextApi = shouldUseNextApi();
  const beUrl = useNextApi
    ? "/api/products/toppings"
    : `${base}/product/toppings`;

  const res = await fetch(beUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(useNextApi ? {} : authHeaders(payload.accessToken)),
    },
    credentials: useNextApi ? "same-origin" : "omit",
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await parseJsonSafely<ToppingResponse>(res);

  if (!res.ok || !data || data.code < 200 || data.code >= 300) {
    throw new ApiError(
      data?.message || "Create topping failed",
      res.status,
      data,
    );
  }

  return data.data;
}

export async function updateToppingById(
  id: number | string,
  payload: Partial<ToppingInput>,
  accessToken?: string,
  options?: { viaNextApi?: boolean },
): Promise<ToppingDto> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const useNextApi = shouldUseNextApi(options);
  const beUrl = useNextApi
    ? `/api/products/toppings/${id}`
    : `${base}/product/toppings/${id}`;

  const res = await fetch(beUrl, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(useNextApi ? {} : authHeaders(accessToken)),
    },
    credentials: useNextApi ? "same-origin" : "omit",
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await parseJsonSafely<ToppingResponse>(res);

  if (!res.ok || !data || data.code < 200 || data.code >= 300) {
    throw new ApiError(
      data?.message || "Update topping failed",
      res.status,
      data,
    );
  }

  return data.data;
}

export async function deleteToppingById(
  id: number | string,
  accessToken?: string,
  options?: { viaNextApi?: boolean },
): Promise<void> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const useNextApi = shouldUseNextApi(options);
  const beUrl = useNextApi
    ? `/api/products/toppings/${id}`
    : `${base}/product/toppings/${id}`;

  const res = await fetch(beUrl, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      ...(useNextApi ? {} : authHeaders(accessToken)),
    },
    credentials: useNextApi ? "same-origin" : "omit",
    cache: "no-store",
  });

  if (!res.ok) {
    const data = await parseJsonSafely<ToppingResponse>(res).catch(() => null);
    throw new ApiError(
      data?.message || "Delete topping failed",
      res.status,
      data,
    );
  }
}
