import envConfig from "@/config";
import { ApiError } from "@/lib/utils";
import type { ScheduleFilter, SchedulesResponse } from "@/types/schedules";

async function parseJsonSafely<T>(res: Response): Promise<T | null> {
  const raw = await res.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new ApiError("BE trả về không phải JSON", 502, raw);
  }
}

export async function getSchedules(
  filter: ScheduleFilter,
): Promise<SchedulesResponse> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const qs = new URLSearchParams({
    page: String(filter.page),
    size: String(filter.size),
  });

  const beUrl = `${base}/employee/schedules?${qs.toString()}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const data = await parseJsonSafely<SchedulesResponse>(res);

  if (!res.ok) {
    throw new ApiError(data?.message || "BE error", res.status, data);
  }

  if (!data || data.code < 200 || data.code >= 300) {
    throw new ApiError(data?.message || "Get schedules failed", 400, data);
  }

  return data;
}
