import { cookies } from "next/headers";
import envConfig from "@/config";
import { ApiError } from "@/lib/utils";

function getTokenFromAuthHeader(value: string | null | undefined) {
  if (!value) return undefined;
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : value;
}

async function parseJsonSafely(res: Response): Promise<unknown> {
  const raw = await res.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

function getApiMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "BE error";
  const message = (payload as { message?: unknown }).message;
  return typeof message === "string" && message.trim() ? message : "BE error";
}

function readCustomerId(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") return null;
  const raw = (payload as { customerId?: unknown }).customerId;
  const customerId = Number(raw);
  return Number.isFinite(customerId) && customerId > 0 ? customerId : null;
}

function readOrderList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: unknown[] }).data;
  }
  return [];
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const headerToken = getTokenFromAuthHeader(req.headers.get("authorization"));
    const accessToken = headerToken ?? cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
    const profileRes = await fetch(`${base}/customers/me`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const profilePayload = await parseJsonSafely(profileRes);

    if (!profileRes.ok) {
      throw new ApiError(
        getApiMessage(profilePayload),
        profileRes.status,
        profilePayload,
      );
    }

    const customerId = readCustomerId(profilePayload);
    if (!customerId) {
      throw new ApiError("Không xác định được customerId", 500, profilePayload);
    }

    const historyUrl = `${base}/orders/history?page=0&size=100&customerId=${encodeURIComponent(String(customerId))}`;
    const historyRes = await fetch(historyUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const historyPayload = await parseJsonSafely(historyRes);

    if (!historyRes.ok) {
      throw new ApiError(
        getApiMessage(historyPayload),
        historyRes.status,
        historyPayload,
      );
    }

    return Response.json(readOrderList(historyPayload), { status: 200 });
  } catch (err) {
    if (err instanceof ApiError) {
      return Response.json(
        { message: err.message, payload: err.payload },
        { status: err.status },
      );
    }
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
