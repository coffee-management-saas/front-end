import envConfig from "@/config";
import { ApiError } from "@/lib/utils";
import type {
  CreateShopEmployeeRequest,
  CreateShopEmployeeResponse,
  ShopEmployeeDetail,
} from "@/types/employee";

function parseJsonFromRaw<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
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

function buildEmployeeBody(payload: CreateShopEmployeeRequest) {
  const {
    userProfileId,
    username,
    password,
    fullname,
    email,
    phone,
    address,
    dob,
    createdAt,
    employee,
    employeeType,
    hourlyWage,
    weeklyHourLimit,
    shopId,
  } = payload;

  const body: Record<string, unknown> = {
    userProfileId,
    username,
    password,
    fullname,
    email,
    phone,
    address,
    dob,
    createdAt,
  };

  if (employee) {
    const nextEmployee: ShopEmployeeDetail = {
      ...employee,
      ...(userProfileId != null && employee.userProfileId == null
        ? { userProfileId }
        : {}),
      ...(shopId != null && employee.shopId == null ? { shopId } : {}),
    };
    body.employee = nextEmployee;
    if (shopId != null) body.shopId = shopId;
    if (employeeType) body.employeeType = employeeType;
    if (hourlyWage != null) body.hourlyWage = hourlyWage;
    if (weeklyHourLimit != null) body.weeklyHourLimit = weeklyHourLimit;
  } else {
    body.employeeType = employeeType;
    body.hourlyWage = hourlyWage;
    body.weeklyHourLimit = weeklyHourLimit;
    if (shopId != null) body.shopId = shopId;
  }

  return body;
}

export async function createShopEmployee(
  payload: CreateShopEmployeeRequest,
  options?: { accessToken?: string; viaNextApi?: boolean },
): Promise<CreateShopEmployeeResponse> {
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
      ...(options?.accessToken
        ? { Authorization: `Bearer ${options.accessToken}` }
        : {}),
    },
    body: JSON.stringify(buildEmployeeBody(payload)),
    credentials: useNextApi ? "same-origin" : "omit",
    cache: "no-store",
  });

  const raw = await res.text();
  const data =
    raw && raw.trim() !== ""
      ? parseJsonFromRaw<CreateShopEmployeeResponse>(raw)
      : null;

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as { message?: unknown }).message)
        : "Create employee failed";
    throw new ApiError(message, res.status, data ?? raw ?? null);
  }

  return data;
}
