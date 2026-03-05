import envConfig from "@/config";
import { ApiError } from "@/lib/utils";
import type {
  ApiEnvelope,
  Product,
  ProductFilter,
  ProductInput,
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

async function parseJsonSafelyNullable<T>(res: Response): Promise<T | null> {
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

export async function getProducts(
  filter: ProductFilter,
  options?: { accessToken?: string; viaNextApi?: boolean },
): Promise<ProductsResponse> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const useNextApi = shouldUseNextApi(options);

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

  const beUrl = useNextApi
    ? `/api/products?${qs.toString()}`
    : `${base}/products?${qs.toString()}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(useNextApi ? {} : authHeaders(options?.accessToken)),
    },
    credentials: useNextApi ? "same-origin" : "omit",
    cache: "no-store",
  });

  const data = await parseJsonSafely<ProductsResponse>(res);

  if (!res.ok) {
    throw new ApiError(data?.message || "BE error", res.status, data);
  }

  return data;
}
export async function getProductById(
  id: number | string,
  accessToken?: string,
): Promise<Product> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const useNextApi = shouldUseNextApi();
  const beUrl = useNextApi ? `/api/products/${id}` : `${base}/products/${id}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(useNextApi ? {} : authHeaders(accessToken)),
    },
    credentials: useNextApi ? "same-origin" : "omit",
    cache: "no-store",
  });

  const payload = await parseJsonSafely<ApiEnvelope<Product>>(res);

  if (!res.ok || !payload || payload.code !== 200) {
    throw new ApiError(payload?.message || "BE error", res.status, payload);
  }

  return payload.data;
}

export async function createProduct(
  payload: ProductInput,
  options?: { accessToken?: string; viaNextApi?: boolean },
): Promise<Product> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const useNextApi = shouldUseNextApi(options);
  const beUrl = useNextApi ? "/api/products" : `${base}/products`;

  const res = await fetch(beUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(useNextApi ? {} : authHeaders(options?.accessToken)),
    },
    credentials: useNextApi ? "same-origin" : "omit",
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await parseJsonSafely<ApiEnvelope<Product>>(res);
  const ok = res.ok && data && (data.code === 200 || data.code === 201);
  if (!ok) {
    throw new ApiError(data?.message || "BE error", res.status, data);
  }

  return data.data;
}

export async function updateProductById(
  id: number | string,
  payload: ProductInput,
  accessToken?: string,
): Promise<Product> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const useNextApi = shouldUseNextApi();
  const beUrl = useNextApi ? `/api/products/${id}` : `${base}/products/${id}`;

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

  const data = await parseJsonSafely<ApiEnvelope<Product>>(res);
  const ok = res.ok && data && (data.code === 200 || data.code === 201);
  if (!ok) {
    throw new ApiError(data?.message || "BE error", res.status, data);
  }

  return data.data;
}

export async function deleteProductById(id: number | string): Promise<void> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/products/${id}`;

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
  options?: { accessToken?: string; viaNextApi?: boolean },
): Promise<ApiEnvelope<ProductVariant[]>> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const useNextApi = shouldUseNextApi(options);
  const qs = productId ? `?productId=${productId}` : "";
  const beUrl = useNextApi
    ? `/api/variants${qs}`
    : `${base}/product/variants${qs}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(useNextApi ? {} : authHeaders(options?.accessToken)),
    },
    credentials: useNextApi ? "same-origin" : "omit",
    cache: "no-store",
  });

  const payload = await parseJsonSafely<ApiEnvelope<ProductVariant[]>>(res);

  if (!res.ok) {
    throw new ApiError(payload?.message || "BE error", res.status, payload);
  }

  return payload;
}

export async function getProductSizes(options?: {
  accessToken?: string;
  viaNextApi?: boolean;
}): Promise<ApiEnvelope<Size[]>> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const useNextApi = shouldUseNextApi(options);
  const beUrl = useNextApi ? "/api/sizes" : `${base}/product/sizes`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(useNextApi ? {} : authHeaders(options?.accessToken)),
    },
    credentials: useNextApi ? "same-origin" : "omit",
    cache: "no-store",
  });

  const payload = await parseJsonSafely<ApiEnvelope<Size[]>>(res);

  if (!res.ok) {
    throw new ApiError(payload?.message || "BE error", res.status, payload);
  }

  return payload;
}

export async function getBestSellers(
  limit: number = 10,
  options?: { accessToken?: string; viaNextApi?: boolean },
): Promise<Product[]> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const useNextApi = shouldUseNextApi(options);

  const beUrl = useNextApi
    ? `/api/products/best-seller?limit=${limit}`
    : `${base}/products/best-seller?limit=${limit}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(useNextApi ? {} : authHeaders(options?.accessToken)),
    },
    credentials: useNextApi ? "same-origin" : "omit",
    cache: "no-store",
  });

  const rawData = await parseJsonSafely<unknown>(res);

  if (!res.ok) {
    throw new ApiError("Fetch best sellers failed", res.status, rawData);
  }

  const items: unknown[] = Array.isArray(rawData)
    ? rawData
    : rawData &&
        typeof rawData === "object" &&
        "data" in (rawData as Record<string, unknown>) &&
        Array.isArray((rawData as { data: unknown[] }).data)
      ? (rawData as { data: unknown[] }).data
      : [];

  return items.map((item: any) => {
    const id =
      typeof item?.id === "number"
        ? item.id
        : typeof item?.productId === "number"
          ? item.productId
          : 0;

    const name =
      (typeof item?.name === "string" && item.name.trim() !== ""
        ? item.name
        : undefined) ??
      (typeof item?.productName === "string" && item.productName.trim() !== ""
        ? item.productName
        : undefined) ??
      "Sản phẩm";

    const image =
      (typeof item?.image === "string" ? item.image : undefined) ??
      (typeof item?.productImage === "string"
        ? item.productImage
        : undefined) ??
      "";

    const directPrice = Number(item?.price);
    const derivedPrice =
      Number(item?.totalQuantity) > 0
        ? Math.round(Number(item?.totalRevenue) / Number(item?.totalQuantity))
        : 0;

    const price =
      Number.isFinite(directPrice) && directPrice > 0
        ? directPrice
        : Number.isFinite(derivedPrice) && derivedPrice > 0
          ? derivedPrice
          : 0;

    return {
      id,
      name,
      image,
      price,
      status: item?.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      categoryId: Number(item?.categoryId) || 0,
      categoryName:
        typeof item?.categoryName === "string" ? item.categoryName : "",
      description:
        typeof item?.description === "string" ? item.description : "",
    } as Product;
  });
}

export async function uploadProductImage(
  productId: number | string,
  file: File,
  accessToken?: string,
): Promise<
  | Product
  | ApiEnvelope<Product>
  | { image?: string | null }
  | { imageUrl?: string }
  | null
> {
  const useNextApi = shouldUseNextApi();
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = useNextApi
    ? `/api/products/${productId}/image`
    : `${base}/products/${productId}/image`;

  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(beUrl, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      ...(useNextApi ? {} : authHeaders(accessToken)),
    },
    body: formData,
    credentials: useNextApi ? "same-origin" : "omit",
    cache: "no-store",
  });

  const data = await parseJsonSafelyNullable<
    Product | ApiEnvelope<Product> | { image?: string | null } | { imageUrl?: string }
  >(res);

  if (!res.ok) {
    throw new ApiError("BE error", res.status, data);
  }

  return data ?? null;
}
