// src/services/category.service.ts
import envConfig from "@/config";
import { ApiError } from "@/lib/utils";
import {
  DeleteResponse,
  ProductCategoriesResponse,
  ProductCategory,
} from "@/types/catagories";

async function parseJsonSafely(res: Response): Promise<unknown> {
  const raw = await res.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new ApiError("BE tra ve khong phai JSON", 502, raw);
  }
}

function shouldUseNextApi(options?: { viaNextApi?: boolean }) {
  if (typeof options?.viaNextApi === "boolean") {
    return options.viaNextApi;
  }
  return typeof window !== "undefined";
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
    status: toOptionalString(o.status),
    createdAt: toOptionalString(o.createdAt),
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

  if (hasDataArray(payload)) {
    return {
      code: toNumber(payload.code, 200),
      status: toString(payload.status, "OK"),
      message: toString(payload.message, ""),
      data: payload.data.map(toCategory),
      meta: toMeta(payload.meta),
    };
  }

  return {
    code: 200,
    status: "OK",
    message: "",
    data: [],
    meta: { currentPage: 1, size: 0, lastPage: 1, totalElements: 0 },
  };
}
function normalizeDelete(payload: unknown): DeleteResponse {
  if (isRecord(payload)) {
    return {
      code: toNumber(payload.code, 200),
      status: toString(payload.status, "OK"),
      message: toString(payload.message, "Deleted successfully"),
      data: null,
    };
  }
  return {
    code: 200,
    status: "OK",
    message: "Deleted successfully",
    data: null,
  };
}
function hasDataObject(
  payload: unknown,
): payload is Record<string, unknown> & { data: unknown } {
  return isRecord(payload) && "data" in payload;
}

function normalizeCreateCategory(payload: unknown) {
  if (hasDataObject(payload)) {
    return {
      code: toNumber(payload.code, 201),
      status: toString(payload.status, "CREATED"),
      message: toString(payload.message, ""),
      data: payload.data ? toCategory(payload.data) : null,
    };
  }

  if (isRecord(payload) && ("id" in payload || "name" in payload)) {
    return {
      code: 201,
      status: "CREATED",
      message: "Create category successfully",
      data: toCategory(payload),
    };
  }

  return {
    code: 502,
    status: "BAD_GATEWAY",
    message: "Invalid create category response",
    data: null,
  };
}

function normalizeUpdateCategory(payload: unknown) {
  if (hasDataObject(payload)) {
    return {
      code: toNumber(payload.code, 200),
      status: toString(payload.status, "OK"),
      message: toString(payload.message, ""),
      data: payload.data ? toCategory(payload.data) : null,
    };
  }

  // fallback nếu BE trả thẳng object category
  if (isRecord(payload) && ("id" in payload || "name" in payload)) {
    return {
      code: 200,
      status: "OK",
      message: "Update category successfully",
      data: toCategory(payload),
    };
  }

  return {
    code: 502,
    status: "BAD_GATEWAY",
    message: "Invalid update category response",
    data: null,
  };
}
export async function getProductCategories(params: {
  page?: number;
  size?: number;
  accessToken?: string;
  options?: { viaNextApi?: boolean };
}): Promise<ProductCategoriesResponse> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const page = params.page ?? 0;
  const size = params.size ?? 10;
  const useNextApi = shouldUseNextApi(params.options);
  const filter = encodeURIComponent(JSON.stringify({ page, size }));
  const beUrl = useNextApi
    ? `/api/product/categories?page=${page}&size=${size}`
    : `${base}/product/categories?filter=${filter}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(useNextApi
        ? {}
        : params.accessToken
          ? { Authorization: `Bearer ${params.accessToken}` }
          : {}),
    },
    credentials: useNextApi ? "same-origin" : "omit",
    cache: "no-store",
  });

  const payload = await parseJsonSafely(res);

  if (!res.ok) {
    throw new ApiError("BE error", res.status, payload);
  }

  return normalizeCategories(payload);
}
// DELETE
export async function deleteProductCategoryById(
  id: number,
  accessToken?: string,
): Promise<DeleteResponse> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/product/categories/${id}`;

  console.log(
    "[deleteProductCategoryById] id:",
    id,
    "beUrl:",
    beUrl,
    "hasToken:",
    !!accessToken,
  );

  const res = await fetch(beUrl, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    cache: "no-store",
  });

  console.log(
    "[deleteProductCategoryById] Response status:",
    res.status,
    "ok:",
    res.ok,
  );

  const payload = await parseJsonSafely(res);

  console.log("[deleteProductCategoryById] Response payload:", payload);

  if (!res.ok) {
    console.error(
      "[deleteProductCategoryById] Error - status:",
      res.status,
      "payload:",
      payload,
    );
    throw new ApiError("BE error", res.status, payload);
  }

  const normalized = normalizeDelete(payload);

  if (normalized.code !== 200) {
    throw new ApiError(
      normalized.message || "Delete category failed",
      400,
      normalized,
    );
  }

  return normalized;
}

// PUT
export async function updateProductCategoryById(
  id: number,
  body: {
    name?: string;
    status?: string;
    createdAt?: string;
  },
  accessToken?: string,
) {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/product/categories/${id}`;

  const res = await fetch(beUrl, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  console.log(
    "[updateProductCategoryById] Response status:",
    res.status,
    "ok:",
    res.ok,
  );

  const payload = await parseJsonSafely(res);

  console.log("[updateProductCategoryById] Response payload:", payload);

  if (!res.ok) {
    console.error(
      "[updateProductCategoryById] Error - status:",
      res.status,
      "payload:",
      payload,
    );
    throw new ApiError("BE error", res.status, payload);
  }

  const normalized = normalizeUpdateCategory(payload);

  if (normalized.code !== 200) {
    throw new ApiError(
      normalized.message || "Update category failed",
      400,
      normalized,
    );
  }

  if (!normalized.data?.id) {
    throw new ApiError(
      normalized.message || "Update category failed (missing data)",
      400,
      normalized,
    );
  }

  return normalized;
}
//POST
export async function createProductCategory(body: {
  name: string;
  status?: string;
  createdAt?: string;
  accessToken?: string;
}) {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/product/categories`;

  const res = await fetch(beUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(body.accessToken
        ? { Authorization: `Bearer ${body.accessToken}` }
        : {}),
    },
    body: JSON.stringify({
      name: body.name,
      status: body.status,
      createdAt: body.createdAt,
    }),
    cache: "no-store",
  });

  console.log(
    "[createProductCategory] Response status:",
    res.status,
    "ok:",
    res.ok,
  );

  const payload = await parseJsonSafely(res);

  console.log("[createProductCategory] Response payload:", payload);

  if (!res.ok) {
    console.error(
      "[createProductCategory] Error - status:",
      res.status,
      "payload:",
      payload,
    );
    throw new ApiError("BE error", res.status, payload);
  }

  const normalized = normalizeCreateCategory(payload);

  if (normalized.code !== 201 && normalized.code !== 200) {
    throw new ApiError(
      normalized.message || "Create category failed",
      400,
      normalized,
    );
  }

  if (!normalized.data?.id) {
    throw new ApiError(
      normalized.message || "Create category failed (missing data)",
      400,
      normalized,
    );
  }

  return normalized;
}

// GET by ID
export async function getCategoryById(
  id: string | number,
  accessToken?: string,
): Promise<ProductCategoriesResponse> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/product/categories/${id}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    cache: "no-store",
  });

  const payload = await parseJsonSafely(res);

  if (!res.ok) {
    throw new ApiError("BE error", res.status, payload);
  }

  return normalizeCategories(payload);
}
