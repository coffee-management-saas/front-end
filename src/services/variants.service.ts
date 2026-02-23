import envConfig from "@/config";
import { ApiError } from "@/lib/utils";
import { Variant, VariantFilter, VariantsResponse } from "@/types/variants";

/** Base URL for backend API (đảm bảo có /api nếu backend dùng context path /api) */
function getApiBase(): string {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
}

async function parseJsonSafely<T>(res: Response): Promise<T> {
  const raw = await res.text();
  if (!raw) throw new ApiError("BE tra ve rong", 502);

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new ApiError("BE tra ve khong phai JSON", 502, raw);
  }
}

export type CreateVariantPayload = {
  productId: number | string;
  sizeId: number | string;
  price: number;
  costPrice: number;
  skuCode: string;
  status: Variant["status"];
};

type CreateVariantResponse = {
  code: number;
  status: string;
  message: string;
  data: Variant;
};

type UpdateVariantResponse = CreateVariantResponse;
type GetVariantResponse = CreateVariantResponse;

export async function getVariants(
  filter: VariantFilter,
  accessToken?: string,
): Promise<VariantsResponse> {
  const base = getApiBase();
  const qs = new URLSearchParams({
    page: String(filter.page),
    size: String(filter.size),
    productId: String(filter.productId),
  });

  if (filter.status) qs.set("status", filter.status);

  const beUrl = `${base}/product/variants?${qs.toString()}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    cache: "no-store",
  });

  const data = await parseJsonSafely<VariantsResponse>(res);

  if (!res.ok || data?.code !== 200) {
    throw new ApiError(data?.message || "BE error", res.status, data);
  }

  return data;
}

export async function createVariant(
  payload: CreateVariantPayload,
  accessToken?: string,
): Promise<Variant> {
  const base = getApiBase();
  const beUrl = `${base}/product/variants`;

  const res = await fetch(beUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({
      productId: payload.productId,
      sizeId: payload.sizeId,
      price: payload.price,
      costPrice: payload.costPrice,
      skuCode: payload.skuCode,
      status: payload.status,
    }),
    cache: "no-store",
  });

  const data = await parseJsonSafely<CreateVariantResponse>(res);

  if (!res.ok || data?.code !== 201) {
    throw new ApiError(data?.message || "BE error", res.status, data);
  }

  return data.data;
}

export async function updateVariant(
  id: number | string,
  payload: CreateVariantPayload,
  accessToken?: string,
): Promise<Variant> {
  const base = getApiBase();
  const beUrl = `${base}/product/variants/${id}`;

  const res = await fetch(beUrl, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({
      productId: payload.productId,
      sizeId: payload.sizeId,
      price: payload.price,
      costPrice: payload.costPrice,
      skuCode: payload.skuCode,
      status: payload.status,
    }),
    cache: "no-store",
  });

  const raw = await res.text();
  if (!raw) {
    if (!res.ok) {
      const msg =
        res.status === 403
          ? "Không có quyền cập nhật biến thể (403)"
          : res.status === 401
            ? "Phiên đăng nhập hết hạn (401)"
            : `Backend trả về rỗng (status: ${res.status})`;
      throw new ApiError(msg, res.status);
    }
    return {
      id: Number(id),
      productId: Number(payload.productId),
      sizeId: Number(payload.sizeId),
      price: payload.price,
      costPrice: payload.costPrice,
      skuCode: payload.skuCode,
      status: payload.status,
      productName: "",
      sizeCode: "",
    };
  }

  let data: UpdateVariantResponse;
  try {
    data = JSON.parse(raw) as UpdateVariantResponse;
  } catch {
    throw new ApiError("BE tra ve khong phai JSON", 502, raw);
  }

  const ok = res.ok && data && (data.code === 200 || data.code === 201);
  if (!ok) {
    throw new ApiError(data?.message || "BE error", res.status, data);
  }

  return data.data;
}

export async function getVariantById(
  id: number | string,
  accessToken?: string,
): Promise<Variant> {
  const base = getApiBase();
  const beUrl = `${base}/product/variants/${id}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    cache: "no-store",
  });

  const data = await parseJsonSafely<GetVariantResponse>(res);

  if (!res.ok || data?.code !== 200) {
    throw new ApiError(data?.message || "BE error", res.status, data);
  }

  return data.data;
}
