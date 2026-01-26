import envConfig from "@/config";
import { ApiError } from "@/lib/utils";
import { ProfileData, UpdateProfileBody } from "@/types/profile";

async function parseJsonSafely<T>(res: Response): Promise<T | null> {
  const raw = await res.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new ApiError("BE trả về không phải JSON", 502, raw);
  }
}
function asRecord(v: unknown): Record<string, unknown> {
  if (v && typeof v === "object") return v as Record<string, unknown>;
  return {};
}
function normalizeProfile(payload: unknown): ProfileData {
  const p = asRecord(payload);

  return {
    customerId: String(p.customerId ?? ""),
    username: String(p.username ?? ""),
    fullname: String(p.fullname ?? ""),
    rankId: String(p.rankId ?? ""),
    email: String(p.email ?? ""),
    phone: String(p.phone ?? ""),
    address: String(p.address ?? ""),
    dob: String(p.dob ?? ""),
    createdAt: String(p.createdAt ?? ""),
    updatedAt: String(p.updatedAt ?? ""),
    status: String(p.status ?? ""),
  };
}

export async function getMyProfile(accessToken: string): Promise<ProfileData> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const url = `${base}/customers/me`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const data = await parseJsonSafely<ProfileData>(res);

  if (!res.ok) {
    throw new ApiError("Không lấy được hồ sơ", res.status, data);
  }

  if (!data) {
    throw new ApiError("Dữ liệu hồ sơ trống", 500);
  }

  return data;
}
export async function updateMyProfile(
  accessToken: string,
  body: UpdateProfileBody,
): Promise<ProfileData> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/customers/me`;

  const res = await fetch(beUrl, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await parseJsonSafely<unknown>(res);

  if (!res.ok) {
    throw new ApiError("BE error", res.status, data);
  }

  return normalizeProfile(data);
}
