import envConfig from "@/config";
import { ApiError } from "@/lib/utils";
import type {
  IngredientDto,
  IngredientInput,
  IngredientResponse,
  IngredientsResponse,
} from "@/types/ingredient";

async function parseJsonSafely<T>(res: Response): Promise<T | null> {
  const raw = await res.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new ApiError("BE tr? v? kh�ng ph?i JSON", 502, raw);
  }
}

export async function getIngredients(
  params: {
    page: number;
    size: number;
  },
  accessToken?: string,
): Promise<IngredientsResponse> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");

  const qs = new URLSearchParams({
    page: String(params.page),
    size: String(params.size),
  });

  const beUrl = `${base}/inventory/ingredients?${qs.toString()}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    cache: "no-store",
  });

  const data = await parseJsonSafely<IngredientsResponse>(res);

  if (!res.ok) {
    throw new ApiError("BE error", res.status, data);
  }

  if (!data || Number(data.code) !== 200) {
    throw new ApiError(data?.message || "Get ingredients failed", 400, data);
  }

  return data;
}

export async function getIngredientById(
  id: number | string,
  accessToken?: string,
): Promise<IngredientDto> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/inventory/ingredients/${id}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    cache: "no-store",
  });

  const data = await parseJsonSafely<IngredientResponse>(res);

  if (!res.ok || !data || data.code < 200 || data.code >= 300) {
    throw new ApiError(
      data?.message || "Get ingredient failed",
      res.status,
      data,
    );
  }

  return data.data;
}

export async function createIngredient(
  payload: IngredientInput,
  accessToken?: string,
): Promise<IngredientDto> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/inventory/ingredients`;

  const res = await fetch(beUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await parseJsonSafely<IngredientResponse>(res);

  if (!res.ok || !data || data.code < 200 || data.code >= 300) {
    throw new ApiError(
      data?.message || "Create ingredient failed",
      res.status,
      data,
    );
  }

  return data.data;
}

export async function updateIngredientById(
  id: number | string,
  payload: Partial<IngredientInput>,
  accessToken?: string,
): Promise<IngredientDto> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/inventory/ingredients/${id}`;

  const res = await fetch(beUrl, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await parseJsonSafely<IngredientResponse>(res);

  if (!res.ok || !data || data.code < 200 || data.code >= 300) {
    throw new ApiError(
      data?.message || "Update ingredient failed",
      res.status,
      data,
    );
  }

  return data.data;
}
