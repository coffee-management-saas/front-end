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

function authHeaders(accessToken?: string): Record<string, string> {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

function shouldUseNextApi(options?: { viaNextApi?: boolean }) {
  if (typeof options?.viaNextApi === "boolean") {
    return options.viaNextApi;
  }
  return typeof window !== "undefined";
}

function readPromotionsFromPayload(payload: unknown): Promotion[] {
  if (Array.isArray(payload)) return payload as Promotion[];
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;
  const data = obj.data;
  return Array.isArray(data) ? (data as Promotion[]) : [];
}

function readErrorFromPayload(
  payload: unknown,
): { code: number; message: string } | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  const rawCode = obj.code;
  const code = typeof rawCode === "number" ? rawCode : Number(rawCode);
  if (!Number.isFinite(code) || code < 400) return null;
  const message =
    typeof obj.message === "string" && obj.message.trim()
      ? obj.message
      : "BE error";
  return { code, message };
}
// Get all promotions
export async function getPromotions(
  accessToken?: string,
  options?: { viaNextApi?: boolean },
): Promise<Promotion[]> {
  const useNextApi = shouldUseNextApi(options);
  const beUrl = useNextApi
    ? "/api/promotion"
    : `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/promotion`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...authHeaders(accessToken),
    },
    credentials: useNextApi ? "same-origin" : "omit",
    cache: "no-store",
  });

  const payload = await parseJsonSafely<unknown>(res);

  // Some BE responses may return an envelope (code/message/data) even with HTTP 200.
  const beError = readErrorFromPayload(payload);
  if (beError) {
    throw new ApiError(beError.message, beError.code, payload);
  }

  const data = readPromotionsFromPayload(payload);

  if (!res.ok) {
    throw new ApiError("BE error", res.status, payload);
  }

  return data;
}
// get promotion by id
export async function getPromotionById(
  promotionId: number | string,
  accessToken?: string,
): Promise<Promotion> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/promotion/${promotionId}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: { Accept: "application/json", ...authHeaders(accessToken) },
    cache: "no-store",
  });

  const data = await parseJsonSafely<Promotion>(res);

  if (!res.ok) {
    throw new ApiError("BE error", res.status, data);
  }

  if (!data) {
    throw new ApiError("Promotion not found", 404);
  }

  return data;
}

export async function deletePromotionById(
  promotionId: number | string,
  accessToken?: string,
): Promise<void> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");

  // backend dùng /promotion/{id}
  const beUrl = `${base}/promotion/${promotionId}`;

  const res = await fetch(beUrl, {
    method: "DELETE",
    headers: { Accept: "application/json", ...authHeaders(accessToken) },
    cache: "no-store",
  });

  // BE có thể trả body hoặc không, nên parse an toàn
  const data = await parseJsonSafely<unknown>(res).catch(() => null);

  if (!res.ok) {
    throw new ApiError("BE error", res.status, data);
  }
}

// Cho phép truyền shopId để tạo mới (BE yêu cầu)
export type PromotionInput = Partial<
  Omit<Promotion, "promotionId" | "createdDate" | "updatedDate">
>;

export async function createPromotion(
  payload: PromotionInput,
  accessToken?: string,
): Promise<Promotion> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/promotion`;

  const res = await fetch(beUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...authHeaders(accessToken),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await parseJsonSafely<Promotion>(res);

  if (!res.ok) {
    throw new ApiError("BE error", res.status, data);
  }

  if (!data) {
    throw new ApiError("BE trả về rỗng", 502);
  }

  return data;
}

export async function updatePromotionById(
  promotionId: number | string,
  payload: PromotionInput,
  accessToken?: string,
): Promise<Promotion> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/promotion/${promotionId}`;

  const res = await fetch(beUrl, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...authHeaders(accessToken),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await parseJsonSafely<Promotion>(res);

  if (!res.ok) {
    throw new ApiError("BE error", res.status, data);
  }

  if (!data) {
    throw new ApiError("BE trả về rỗng", 502);
  }

  return data;
}

export async function uploadPromotionImage(
  promotionId: number | string,
  file: File,
  accessToken?: string,
): Promise<Promotion | { imageUrl?: string } | null> {
  const useNextApi = shouldUseNextApi();
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = useNextApi
    ? `/api/promotion/${promotionId}/image`
    : `${base}/promotion/${promotionId}/image`;

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

  const data = await parseJsonSafely<Promotion | { imageUrl?: string }>(res);

  if (!res.ok) {
    throw new ApiError("BE error", res.status, data);
  }

  return data ?? null;
}
