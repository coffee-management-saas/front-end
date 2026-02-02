// src/services/category.service.ts
import envConfig from "@/config";
import { ApiError } from "@/lib/utils";
import { ProductCategoriesResponse, ProductCategory } from "@/types/catagories";

async function parseJsonSafely(res: Response): Promise<unknown> {
  const raw = await res.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new ApiError("BE tra ve khong phai JSON", 502, raw);
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
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

const toOptionalString = (value: unknown): string | undefined => {
  if (value == null) return undefined;
  const s = toString(value, "");
  return s === "" ? undefined : s;
};

function toCategory(x: unknown): ProductCategory {
  const o = isRecord(x) ? x : {};
  return {
    id: toNumber(o.id ?? o.categoryId, 0),
    name: toString(o.name ?? o.categoryName, ""),
    description: toOptionalString(o.description),
    status: toOptionalString(o.status),
    createdAt: toOptionalString(o.createdAt),
    updatedAt: toOptionalString(o.updatedAt),
  };
}

function toMeta(meta: unknown): ProductCategoriesResponse["meta"] {
  const o = isRecord(meta) ? meta : {};
  return {
    currentPage: toNumber(o.currentPage, 1),
    size: toNumber(o.size, 0),
    lastPage: toNumber(o.lastPage, 1),
    totalElements: toNumber(o.totalElements, 0),
  };
}

function hasDataArray(
  payload: unknown,
): payload is Record<string, unknown> & { data: unknown[] } {
  return isRecord(payload) && Array.isArray(payload.data);
}

function normalizeCategories(payload: unknown): ProductCategoriesResponse {
  // Case 1: BE returns array directly
  if (Array.isArray(payload)) {
    return {
      code: 200,
      status: "OK",
      message: "Success",
      data: payload.map(toCategory),
      meta: {
        currentPage: 1,
        size: payload.length,
        lastPage: 1,
        totalElements: payload.length,
      },
    };
  }

  // Case 2: BE returns { code, status, message, data: [], meta }
  if (hasDataArray(payload)) {
    return {
      code: toNumber(payload.code, 200),
      status: toString(payload.status, "OK"),
      message: toString(payload.message, ""),
      data: payload.data.map(toCategory),
      meta: toMeta(payload.meta),
    };
  }

  // Fallback
  return {
    code: 200,
    status: "OK",
    message: "",
    data: [],
    meta: { currentPage: 1, size: 0, lastPage: 1, totalElements: 0 },
  };
}

export async function getProductCategories(params: {
  page?: number;
  size?: number;
}): Promise<ProductCategoriesResponse> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const page = params.page ?? 0;
  const size = params.size ?? 10;

  const beUrl = `${base}/product/categories?page=${page}&size=${size}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const payload = await parseJsonSafely(res);

  if (!res.ok) {
    throw new ApiError("BE error", res.status, payload);
  }

  return normalizeCategories(payload);
}
