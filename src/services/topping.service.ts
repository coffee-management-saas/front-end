// services/topping.service.ts

import envConfig from "@/config";
import { ApiError } from "@/lib/utils";
import { ToppingsResponse } from "@/types/topping";

async function parseJsonSafely<T>(res: Response): Promise<T | null> {
  const raw = await res.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new ApiError("BE trả về không phải JSON", 502, raw);
  }
}

export async function getToppings(params: {
  page: number;
  size: number;
}): Promise<ToppingsResponse> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");

  // ✅ Nếu base = http://localhost:8081/api => beUrl = http://localhost:8081/api/product/toppings...
  const qs = new URLSearchParams({
    page: String(params.page),
    size: String(params.size),
  });

  const beUrl = `${base}/product/toppings?${qs.toString()}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
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
