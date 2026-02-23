import envConfig from "@/config";
import { ApiError } from "@/lib/utils";
import type {
  CreateEmployeeResponseEnvelope,
  EmployeeDetailResponse,
  EmployeeDto,
  EmployeesFilter,
  EmployeesResponse,
  EmployeeType,
  ShopEmployeeProfile,
  UpdateEmployeeInput,
  UpdateEmployeeResponse,
} from "@/types/employee";

async function parseJsonSafely<T>(res: Response): Promise<T> {
  const raw = await res.text();
  if (!raw) throw new ApiError("BE trả về rỗng", 502);

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
  if (typeof options?.viaNextApi === "boolean") return options.viaNextApi;
  return typeof window !== "undefined";
}

export async function getEmployees(
  filter: EmployeesFilter,
  options?: { accessToken?: string; viaNextApi?: boolean },
): Promise<EmployeesResponse> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const useNextApi = shouldUseNextApi(options);

  const qs = new URLSearchParams({
    page: String(filter.page),
    size: String(filter.size),
  });

  const beUrl = useNextApi
    ? `/api/employees?${qs.toString()}`
    : `${base}/employee/employees?${qs.toString()}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(useNextApi ? {} : authHeaders(options?.accessToken)),
    },
    credentials: useNextApi ? "same-origin" : "omit",
    cache: "no-store",
  });

  const data = await parseJsonSafely<EmployeesResponse>(res);

  if (!res.ok) {
    throw new ApiError(data?.message || "BE error", res.status, data);
  }

  if (!data || data.code < 200 || data.code >= 300) {
    throw new ApiError(data?.message || "Get employees failed", 400, data);
  }

  return data;
}

export async function getEmployeeById(
  id: number | string,
  options?: { accessToken?: string; viaNextApi?: boolean },
): Promise<ShopEmployeeProfile> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const useNextApi = shouldUseNextApi(options);

  const beUrl = useNextApi
    ? `/api/employees/${id}`
    : `${base}/employee/employees/${id}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(useNextApi ? {} : authHeaders(options?.accessToken)),
    },
    credentials: useNextApi ? "same-origin" : "omit",
    cache: "no-store",
  });

  const payload = await parseJsonSafely<EmployeeDetailResponse>(res);

  if (!res.ok || !payload || payload.code !== 200) {
    throw new ApiError(
      payload?.message || "Get employee failed",
      res.status,
      payload,
    );
  }

  return payload.data;
}

export type CreateEmployeeInput = {
  username: string;
  password: string;
  fullname: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
  employeeType: EmployeeType;
  hourlyWage: number;
  weeklyHourLimit: number;
};

export async function createEmployee(
  payload: CreateEmployeeInput,
  options?: { accessToken?: string; viaNextApi?: boolean },
): Promise<ShopEmployeeProfile | null> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const useNextApi = shouldUseNextApi(options);

  const beUrl = useNextApi
    ? "/api/employees"
    : `${base}/auth/shop-employee/create`;

  const res = await fetch(beUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(useNextApi ? {} : authHeaders(options?.accessToken)),
    },
    credentials: useNextApi ? "same-origin" : "omit",
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await parseJsonSafely<
    CreateEmployeeResponseEnvelope | ShopEmployeeProfile | null
  >(res);

  if (!res.ok) {
    const envelope = data as CreateEmployeeResponseEnvelope | null;
    const message =
      typeof envelope?.message === "string" && envelope.message.trim()
        ? envelope.message
        : "Create employee failed";
    throw new ApiError(message, res.status, data);
  }

  if (data && typeof data === "object" && "code" in data) {
    const rawCode = (data as CreateEmployeeResponseEnvelope).code;
    const code = typeof rawCode === "number" ? rawCode : Number(rawCode);
    const ok = Number.isFinite(code) ? code >= 200 && code < 300 : true;
    if (!ok) {
      throw new ApiError(
        (data as CreateEmployeeResponseEnvelope).message ||
          "Create employee failed",
        400,
        data,
      );
    }
    return (data as CreateEmployeeResponseEnvelope).data ?? null;
  }

  // Some endpoints may return the profile directly without an envelope.
  if (data && typeof data === "object") {
    return data as ShopEmployeeProfile;
  }

  return null;
}

export async function updateEmployeeById(
  id: number | string,
  payload: UpdateEmployeeInput,
  options?: { accessToken?: string; viaNextApi?: boolean },
): Promise<EmployeeDto> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const useNextApi = shouldUseNextApi(options);

  const beUrl = useNextApi
    ? `/api/employees/${id}`
    : `${base}/employee/employees/${id}`;

  const res = await fetch(beUrl, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(useNextApi ? {} : authHeaders(options?.accessToken)),
    },
    credentials: useNextApi ? "same-origin" : "omit",
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await parseJsonSafely<
    UpdateEmployeeResponse | EmployeeDto | null
  >(res);

  if (!res.ok) {
    const envelope = data as UpdateEmployeeResponse | null;
    const message =
      typeof envelope?.message === "string" && envelope.message.trim()
        ? envelope.message
        : "Update employee failed";
    throw new ApiError(message, res.status, data);
  }

  if (data && typeof data === "object" && "code" in data) {
    const rawCode = (data as UpdateEmployeeResponse).code;
    const code = typeof rawCode === "number" ? rawCode : Number(rawCode);
    const ok = Number.isFinite(code) ? code >= 200 && code < 300 : true;
    if (!ok) {
      throw new ApiError(
        (data as UpdateEmployeeResponse).message || "Update employee failed",
        400,
        data,
      );
    }
    return (data as UpdateEmployeeResponse).data;
  }

  if (data && typeof data === "object") {
    return data as EmployeeDto;
  }

  throw new ApiError("Update employee failed", 502, data);
}

export async function deleteEmployeeById(
  id: number | string,
  options?: { accessToken?: string; viaNextApi?: boolean },
): Promise<void> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const useNextApi = shouldUseNextApi(options);

  const beUrl = useNextApi
    ? `/api/employees/${id}`
    : `${base}/employee/employees/${id}`;

  const res = await fetch(beUrl, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      ...(useNextApi ? {} : authHeaders(options?.accessToken)),
    },
    credentials: useNextApi ? "same-origin" : "omit",
    cache: "no-store",
  });

  if (res.ok) return;

  const data = await parseJsonSafely<{ message?: string } | null>(res).catch(
    () => null,
  );
  throw new ApiError(
    data?.message || "Delete employee failed",
    res.status,
    data,
  );
}
