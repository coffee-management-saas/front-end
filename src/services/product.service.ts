import envConfig from "@/config";
import { ApiError } from "@/lib/utils";
import type {
  ApiEnvelope,
  Product,
  ProductFilter,
  ProductsResponse,
  ProductVariant, // Add this
  Size,
} from "@/types/product";

async function parseJsonSafely<T>(res: Response): Promise<T> {
  const raw = await res.text();
  if (!raw) throw new ApiError("BE trả về rỗng", 502);

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new ApiError("BE trả về không phải JSON", 502, raw);
  }
}

export async function getProducts(
  filter: ProductFilter,
): Promise<ProductsResponse> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");

  const qs = new URLSearchParams({
    page: String(filter.page),
    size: String(filter.size),
  });

  if (
    typeof filter.categoryId === "number" &&
    Number.isFinite(filter.categoryId)
  ) {
    qs.set("categoryId", String(filter.categoryId));
  }
  if (filter.status) {
    qs.set("status", filter.status);
  }

  const beUrl = `${base}/product/products?${qs.toString()}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const data = await parseJsonSafely<ProductsResponse>(res);

  if (!res.ok) {
    throw new ApiError(data?.message || "BE error", res.status, data);
  }

  return data;
}
export async function getProductById(id: number | string): Promise<Product> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/product/products/${id}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const payload = await parseJsonSafely<ApiEnvelope<Product>>(res);

  if (!res.ok || !payload || payload.code !== 200) {
    throw new ApiError(payload?.message || "BE error", res.status, payload);
  }

  return payload.data;
}

export async function getProductVariants(productId?: number | string): Promise<ApiEnvelope<ProductVariant[]>> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const qs = productId ? `?productId=${productId}` : "";
  const beUrl = `${base}/product/variants${qs}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const payload = await parseJsonSafely<ApiEnvelope<ProductVariant[]>>(res);

  if (!res.ok) {
    throw new ApiError(payload?.message || "BE error", res.status, payload);
  }

  return payload;
}

export async function getProductSizes(): Promise<ApiEnvelope<Size[]>> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/product/sizes`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const payload = await parseJsonSafely<ApiEnvelope<Size[]>>(res);

  if (!res.ok) {
    throw new ApiError(payload?.message || "BE error", res.status, payload);
  }

  return payload;
}
