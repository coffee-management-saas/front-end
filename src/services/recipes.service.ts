import envConfig from "@/config";
import { ApiError } from "@/lib/utils";
import type {
  RecipeCreateInput,
  RecipeItemDto,
  RecipeResponse,
} from "@/types/recipes";

async function parseJsonSafely<T>(res: Response): Promise<T | null> {
  const raw = await res.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new ApiError("BE trả về không phải JSON", 502, raw);
  }
}

export async function createRecipe(
  payload: RecipeCreateInput,
  accessToken?: string,
): Promise<RecipeItemDto[]> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/inventory/recipes`;

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

  const data = await parseJsonSafely<RecipeResponse>(res);

  if (!res.ok || !data || data.code < 200 || data.code >= 300) {
    throw new ApiError(
      data?.message || "Create recipe failed",
      res.status,
      data,
    );
  }

  return data.data;
}

export async function getRecipesByVariant(
  variantId: number | string,
  accessToken?: string,
): Promise<RecipeItemDto[]> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/inventory/recipes/variant/${variantId}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    cache: "no-store",
  });

  const data = await parseJsonSafely<RecipeResponse>(res);

  if (!res.ok || !data || data.code < 200 || data.code >= 300) {
    throw new ApiError(
      data?.message || "Get recipes by variant failed",
      res.status,
      data,
    );
  }

  return data.data;
}
