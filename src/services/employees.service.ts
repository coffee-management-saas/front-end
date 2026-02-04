import envConfig from "@/config";
import { ApiError } from "@/lib/utils";
import type { EmployeeResponse } from "@/types/employee";

async function parseJsonSafely<T>(res: Response): Promise<T | null> {
  const raw = await res.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new ApiError("BE trả về không phải JSON", 502, raw);
  }
}

export async function getEmployees(params?: {
  page?: number;
  size?: number;
}): Promise<EmployeeResponse> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const page = params?.page ?? 0;
  const size = params?.size ?? 10;

  const qs = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  const beUrl = `${base}/employee/employees?${qs.toString()}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const data = await parseJsonSafely<EmployeeResponse>(res);

  if (!res.ok) {
    throw new ApiError("BE error", res.status, data);
  }

  if (!data || data.code < 200 || data.code >= 300) {
    throw new ApiError(data?.message || "Get employees failed", 400, data);
  }

  return data;
}

export async function createEmployee(body: unknown): Promise<unknown> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/employee/employees`;

  const res = await fetch(beUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body ?? {}),
    cache: "no-store",
  });

  const data = await parseJsonSafely<unknown>(res);

  if (!res.ok) {
    throw new ApiError("BE error", res.status, data);
  }

  return data;
}

export async function updateEmployeeById(
  id: number | string,
  body: unknown,
): Promise<unknown> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/employee/employees/${id}`;

  const res = await fetch(beUrl, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body ?? {}),
    cache: "no-store",
  });

  const data = await parseJsonSafely<unknown>(res);

  if (!res.ok) {
    throw new ApiError("BE error", res.status, data);
  }

  return data;
}

export async function deleteEmployeeById(
  id: number | string,
): Promise<unknown> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/employee/employees/${id}`;

  const res = await fetch(beUrl, {
    method: "DELETE",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const data = await parseJsonSafely<unknown>(res);

  if (!res.ok) {
    throw new ApiError("BE error", res.status, data);
  }

  return data;
}
