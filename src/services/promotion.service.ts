import envConfig from "@/config";
import { ApiError } from "@/lib/utils";
import { Promotion } from "@/types/promotion";

async function parseJsonSafely<T>(res: Response): Promise<T | null> {
  const raw = await res.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new ApiError("BE trả về không phải JSON", 502, raw);
  }
}
// Get all promotions
export async function getPromotions(): Promise<Promotion[]> {
  const beUrl = `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/promotions`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const data = (await parseJsonSafely<Promotion[]>(res)) ?? [];

  if (!res.ok) {
    throw new ApiError("BE error", res.status, data);
  }

  return data;
}
// get promotion by id
export async function getPromotionById(
  promotionId: number | string,
): Promise<Promotion> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/promotions/${promotionId}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const data = await parseJsonSafely<Promotion>(res);
  console.log("BE URL:", beUrl);

  if (!res.ok) {
    throw new ApiError("BE error", res.status, data);
  }

  if (!data) {
    throw new ApiError("Promotion not found", 404);
  }

  return data;
}
