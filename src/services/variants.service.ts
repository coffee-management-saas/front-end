import envConfig from "@/config";
import { ApiError } from "@/lib/utils";
import { Variant, VariantFilter, VariantsResponse } from "@/types/variants";

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

export async function getVariants(
  filter: VariantFilter,
): Promise<VariantsResponse> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");

  const qs = new URLSearchParams({
    page: String(filter.page),
    size: String(filter.size),
    productId: String(filter.productId),
  });

  if (filter.status) qs.set("status", filter.status);

  const beUrl = `${base}/product/variants?${qs.toString()}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
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
): Promise<Variant> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/product/variants`;

  const res = await fetch(beUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
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
