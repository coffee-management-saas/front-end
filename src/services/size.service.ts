import envConfig from "@/config";
import { ApiError } from "@/lib/utils";
import type {
  CreateSizePayload,
  Size,
  SizeStatus,
  UpdateSizePayload,
} from "@/types/size";

async function parseJsonSafely<T>(res: Response): Promise<T | null> {
  const raw = await res.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new ApiError("BE tra ve khong phai JSON", 502, raw);
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function extractErrorMessage(payload: unknown): string | undefined {
  if (typeof payload === "string" && payload.trim() !== "") return payload;
  if (isRecord(payload)) {
    const candidates = [
      payload.message,
      payload.error,
      payload.detail,
      payload.title,
    ];
    for (const c of candidates) {
      if (typeof c === "string" && c.trim() !== "") return c;
    }
  }
  return undefined;
}

function authHeaders(accessToken?: string): Record<string, string> {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
};

const toString = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
};

const toStatus = (value: unknown): SizeStatus => {
  const s = toString(value, "ACTIVE").toUpperCase();
  if (s === "INACTIVE") return "INACTIVE";
  if (s === "OUTOFSTOCK") return "OUTOFSTOCK";
  if (s === "DELETED") return "DELETED";
  return "ACTIVE";
};

function toSize(x: unknown): Size {
  const o = isRecord(x) ? x : {};
  return {
    id: toNumber(o.sizeId ?? o.id, 0),
    code: toString(o.code ?? o.sizeCode ?? o.name, ""),
    status: toStatus(o.status),
  };
}

function unwrapData(payload: unknown): unknown {
  if (isRecord(payload) && "data" in payload) {
    return payload.data;
  }
  return payload;
}

function normalizeSizes(payload: unknown): Size[] {
  if (Array.isArray(payload)) {
    return payload.map(toSize);
  }

  if (isRecord(payload) && Array.isArray(payload.data)) {
    return payload.data.map(toSize);
  }

  return [];
}

export async function getSizes(
  status?: SizeStatus,
  accessToken?: string,
): Promise<Size[]> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");

  const qs = new URLSearchParams();
  if (status) qs.set("status", status);

  const beUrl = `${base}/product/sizes${qs.toString() ? `?${qs}` : ""}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: { Accept: "application/json", ...authHeaders(accessToken) },
    cache: "no-store",
  });

  const payload = await parseJsonSafely<unknown>(res);

  if (!res.ok) {
    throw new ApiError(
      extractErrorMessage(payload) || "BE error",
      res.status,
      payload,
    );
  }

  return normalizeSizes(payload);
}

export async function createSize(
  payload: CreateSizePayload,
  accessToken?: string,
): Promise<Size> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/product/sizes`;

  const res = await fetch(beUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...authHeaders(accessToken),
    },
    body: JSON.stringify({
      code: payload.code,
      status: payload.status,
    }),
  });

  const data = await parseJsonSafely<unknown>(res);

  if (!res.ok) {
    throw new ApiError(
      extractErrorMessage(data) || "BE error",
      res.status,
      data,
    );
  }

  return toSize(unwrapData(data));
}

export async function updateSize(
  sizeId: number | string,
  payload: UpdateSizePayload,
  accessToken?: string,
): Promise<Size> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/product/sizes/${sizeId}`;

  const res = await fetch(beUrl, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...authHeaders(accessToken),
    },
    body: JSON.stringify({
      code: payload.code,
      status: payload.status,
    }),
  });

  const data = await parseJsonSafely<unknown>(res);

  if (!res.ok) {
    throw new ApiError(
      extractErrorMessage(data) || "BE error",
      res.status,
      data,
    );
  }

  return toSize(unwrapData(data));
}

export async function deleteSize(
  sizeId: number | string,
  accessToken?: string,
): Promise<void> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/product/sizes/${sizeId}`;

  const res = await fetch(beUrl, {
    method: "DELETE",
    headers: { Accept: "application/json", ...authHeaders(accessToken) },
  });

  const data = await parseJsonSafely<unknown>(res);

  if (!res.ok) {
    throw new ApiError(
      extractErrorMessage(data) || "BE error",
      res.status,
      data,
    );
  }
}
