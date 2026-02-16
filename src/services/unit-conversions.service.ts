import envConfig from "@/config";
import { ApiError } from "@/lib/utils";
import type {
  UnitConversionInput,
  UnitConversionResponse,
  UnitConversionDto,
} from "@/types/unit-conversion";

async function parseJsonSafely<T>(res: Response): Promise<T | null> {
  const raw = await res.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new ApiError("BE trả về không phải JSON", 502, raw);
  }
}

export async function createUnitConversion(
  payload: UnitConversionInput,
  accessToken?: string,
): Promise<UnitConversionDto> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/inventory/unit-conversions`;

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

  const data = await parseJsonSafely<UnitConversionResponse>(res);

  if (!res.ok || !data || data.code < 200 || data.code >= 300) {
    throw new ApiError(
      data?.message || "Create unit conversion failed",
      res.status,
      data,
    );
  }

  return data.data;
}
