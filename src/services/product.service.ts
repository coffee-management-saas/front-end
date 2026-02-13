import envConfig from "@/config";
import { ApiError } from "@/lib/utils";
import type {
  ApiEnvelope,
  Product,
  ProductFilter,
  ProductInput,
  ProductsResponse,
  ProductVariant, // Add this
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

export async function createProduct(payload: ProductInput): Promise<Product> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/product/products`;

  const res = await fetch(beUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await parseJsonSafely<ApiEnvelope<Product>>(res);

  if (!res.ok || !data || data.code !== 200) {
    throw new ApiError(data?.message || "BE error", res.status, data);
  }

  return data.data;
}

export async function updateProductById(
  id: number | string,
  payload: ProductInput,
): Promise<Product> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/product/products/${id}`;

  const res = await fetch(beUrl, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await parseJsonSafely<ApiEnvelope<Product>>(res);

  if (!res.ok || !data || data.code !== 200) {
    throw new ApiError(data?.message || "BE error", res.status, data);
  }

  return data.data;
}

export async function deleteProductById(id: number | string): Promise<void> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/product/products/${id}`;

  const res = await fetch(beUrl, {
    method: "DELETE",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const data = await parseJsonSafely<ApiEnvelope<null>>(res).catch(
      () => null,
    );
    throw new ApiError(data?.message || "BE error", res.status, data);
  }
}

export async function getProductVariants(
  productId?: number | string,
): Promise<ApiEnvelope<ProductVariant[]>> {
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
