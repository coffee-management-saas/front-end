import envConfig from "@/config";
import { ApiError } from "@/lib/utils";
import type {
  CustomerDetailResponse,
  CustomerDto,
  CustomersFilter,
  CustomersResponse,
  UpdateCustomerInput,
} from "@/types/customer";

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

export async function getCustomers(
  filter: CustomersFilter,
  options?: { accessToken?: string; viaNextApi?: boolean },
): Promise<CustomersResponse> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const useNextApi = shouldUseNextApi(options);

  const qs = new URLSearchParams({
    page: String(filter.page),
    size: String(filter.size),
  });

  const beUrl = useNextApi
    ? `/api/customers?${qs.toString()}`
    : `${base}/customers?${qs.toString()}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(useNextApi ? {} : authHeaders(options?.accessToken)),
    },
    credentials: useNextApi ? "same-origin" : "omit",
    cache: "no-store",
  });

  const data = await parseJsonSafely<CustomersResponse>(res);

  if (!res.ok) {
    throw new ApiError(data?.message || "BE error", res.status, data);
  }

  if (!data || data.code < 200 || data.code >= 300) {
    throw new ApiError(data?.message || "Get customers failed", 400, data);
  }

  return data;
}

export async function getCustomerById(
  id: number | string,
  options?: { accessToken?: string; viaNextApi?: boolean },
): Promise<CustomerDto> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const useNextApi = shouldUseNextApi(options);

  const beUrl = useNextApi ? `/api/customers/${id}` : `${base}/customers/${id}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(useNextApi ? {} : authHeaders(options?.accessToken)),
    },
    credentials: useNextApi ? "same-origin" : "omit",
    cache: "no-store",
  });

  const payload = await parseJsonSafely<CustomerDetailResponse>(res);

  if (!res.ok || !payload || payload.code !== 200) {
    throw new ApiError(
      payload?.message || "Get customer failed",
      res.status,
      payload,
    );
  }

  return payload.data;
}

export async function updateCustomerById(
  id: number | string,
  payload: UpdateCustomerInput,
  options?: { accessToken?: string; viaNextApi?: boolean },
): Promise<CustomerDto> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const useNextApi = shouldUseNextApi(options);

  const beUrl = useNextApi ? `/api/customers/${id}` : `${base}/customers/${id}`;

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
    CustomerDetailResponse | { message?: string; code?: number; data?: unknown }
  >(res);

  if (!res.ok) {
    throw new ApiError(
      (data as { message?: string } | null)?.message || "Update customer failed",
      res.status,
      data,
    );
  }

  const envelope = data as CustomerDetailResponse | null;
  if (envelope?.code && (envelope.code < 200 || envelope.code >= 300)) {
    throw new ApiError(envelope.message || "Update customer failed", 400, data);
  }

  if (envelope && "data" in envelope && envelope.data) {
    return envelope.data as CustomerDto;
  }

  throw new ApiError("Update customer failed", 502, data);
}

export async function deleteCustomerById(
  id: number | string,
  options?: { accessToken?: string; viaNextApi?: boolean },
): Promise<void> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const useNextApi = shouldUseNextApi(options);

  const beUrl = useNextApi ? `/api/customers/${id}` : `${base}/customers/${id}`;

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
    data?.message || "Delete customer failed",
    res.status,
    data,
  );
}
