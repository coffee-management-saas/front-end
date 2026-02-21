import envConfig from "@/config";
import { ApiError } from "@/lib/utils";
import type {
  StockCheckStartPayload,
  StockCheckStartResponse,
  StockCheckUpdatePayload,
  StockCheckUpdateResponse,
  StockCheckApprovePayload,
  StockCheckApproveResponse,
  StockChecksResponse,
} from "@/types/stock";

async function parseJsonSafely<T>(res: Response): Promise<T | null> {
  const raw = await res.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    throw new ApiError("BE trả về không phải JSON", 502, raw);
  }
}

export async function getStockChecks(
  params: { page: number; size: number },
  accessToken?: string,
): Promise<StockChecksResponse> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const qs = new URLSearchParams({
    page: String(params.page),
    size: String(params.size),
  });

  const beUrl = `${base}/inventory/stock-checks?${qs.toString()}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    cache: "no-store",
  });

  const data = await parseJsonSafely<StockChecksResponse>(res);

  if (!res.ok) {
    throw new ApiError("BE error", res.status, data);
  }

  if (!data || Number(data.code) !== 200) {
    throw new ApiError(data?.message || "Get stock checks failed", 400, data);
  }

  return data;
}

export async function startStockCheck(
  payload: StockCheckStartPayload,
  accessToken?: string,
): Promise<StockCheckStartResponse> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/inventory/stock-checks/start`;

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

  const data = await parseJsonSafely<StockCheckStartResponse>(res);

  if (!res.ok) {
    throw new ApiError("BE error", res.status, data);
  }

  if (!data || Number(data.code) < 200 || Number(data.code) >= 300) {
    throw new ApiError(data?.message || "Start stock check failed", 400, data);
  }

  return data;
}

export async function updateStockCounts(
  payload: StockCheckUpdatePayload,
  accessToken?: string,
): Promise<StockCheckUpdateResponse> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/inventory/stock-checks/update-count`;

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

  const data = await parseJsonSafely<StockCheckUpdateResponse>(res);

  if (!res.ok) {
    throw new ApiError("BE error", res.status, data);
  }

  if (!data || Number(data.code) < 200 || Number(data.code) >= 300) {
    throw new ApiError(
      data?.message || "Update stock counts failed",
      400,
      data,
    );
  }

  return data;
}

export async function approveStockCheck(
  payload: StockCheckApprovePayload,
  accessToken?: string,
): Promise<StockCheckApproveResponse> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/inventory/stock-checks/approve`;

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

  const data = await parseJsonSafely<StockCheckApproveResponse>(res);

  if (!res.ok) {
    throw new ApiError("BE error", res.status, data);
  }

  if (!data || Number(data.code) < 200 || Number(data.code) >= 300) {
    throw new ApiError(
      data?.message || "Approve stock check failed",
      400,
      data,
    );
  }

  return data;
}
