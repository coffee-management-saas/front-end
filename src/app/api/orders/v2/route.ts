import { cookies } from "next/headers";
import envConfig from "@/config";

const FINAL_ORDER_STATUSES = new Set([
  "PAID",
  "CANCELLED",
  "CANCELED",
  "FAILED",
  "EXPIRED",
  "DONE",
]);

function getBaseCandidates(): string[] {
  const raw = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const candidates = [raw];

  if (raw.endsWith("/api")) {
    candidates.push(raw.slice(0, -4));
  } else {
    candidates.push(`${raw}/api`);
  }

  return Array.from(new Set(candidates)).filter(Boolean);
}

function getTokenFromAuthHeader(value: string | null | undefined) {
  if (!value) return undefined;
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : value;
}

async function readJsonOrNull(res: Response): Promise<unknown | null> {
  const text = await res.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: "Backend returned non-JSON response", raw: text };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function extractMessage(payload: unknown): string {
  if (!isRecord(payload)) return "";
  return typeof payload.message === "string" ? payload.message.trim() : "";
}

function readCustomerId(payload: unknown): number | null {
  if (!isRecord(payload)) return null;
  const customerId = Number(payload.customerId);
  return Number.isFinite(customerId) && customerId > 0 ? customerId : null;
}

function isExistingPaymentConflict(payload: unknown): boolean {
  return extractMessage(payload).toLowerCase().includes("đơn thanh toán đã tồn tại");
}

function readOrdersArray(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (isRecord(payload) && Array.isArray(payload.data)) {
    return payload.data.filter(isRecord);
  }

  return [];
}

function isPendingRedirectOrder(order: Record<string, unknown>): boolean {
  const orderId = Number(order.orderId);
  const gateway = String(order.paymentGateway ?? "")
    .trim()
    .toUpperCase();
  const status = String(order.orderStatus ?? "")
    .trim()
    .toUpperCase();

  if (!Number.isFinite(orderId) || orderId <= 0 || FINAL_ORDER_STATUSES.has(status)) {
    return false;
  }

  return gateway === "PAYOS" || gateway === "MOMO" || gateway === "QR";
}

function sortOrdersByCreatedAtDesc(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
) {
  const leftTime = Date.parse(String(left.createdAt ?? ""));
  const rightTime = Date.parse(String(right.createdAt ?? ""));
  return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
}

async function refreshAccessToken(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  const refreshToken = cookieStore.get("refreshToken")?.value;
  if (!refreshToken) return null;

  for (const base of getBaseCandidates()) {
    const backendRes = await fetch(`${base}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    }).catch(() => null);

    if (!backendRes) continue;

    const payload = await readJsonOrNull(backendRes);
    if (!backendRes.ok || !payload || typeof payload !== "object") {
      continue;
    }

    const obj = payload as Record<string, unknown>;
    const newAccessToken =
      typeof obj.accessToken === "string" ? obj.accessToken : undefined;
    const newRefreshToken =
      typeof obj.refreshToken === "string" ? obj.refreshToken : undefined;

    if (!newAccessToken) continue;

    cookieStore.set("accessToken", newAccessToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });

    if (newRefreshToken) {
      cookieStore.set("refreshToken", newRefreshToken, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      });
    }

    return newAccessToken;
  }

  return null;
}

async function findPendingRedirectOrder(accessToken: string) {
  for (const base of getBaseCandidates()) {
    const profileRes = await fetch(`${base}/customers/me`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }).catch(() => null);

    if (!profileRes) continue;

    const profilePayload = await readJsonOrNull(profileRes);
    if (!profileRes.ok) continue;

    const customerId = readCustomerId(profilePayload);
    if (!customerId) continue;

    const historyRes = await fetch(
      `${base}/orders/history?page=0&size=100&customerId=${encodeURIComponent(String(customerId))}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    ).catch(() => null);

    if (!historyRes) continue;

    const payload = await readJsonOrNull(historyRes);
    if (!historyRes.ok) continue;

    const orders = readOrdersArray(payload)
      .filter(isPendingRedirectOrder)
      .sort(sortOrdersByCreatedAtDesc);

    if (orders[0]) {
      return orders[0];
    }
  }

  return null;
}

async function resumePendingRedirectPayment(
  accessToken: string,
  returnUrl: string,
) {
  const existingOrder = await findPendingRedirectOrder(accessToken);
  const orderId = Number(existingOrder?.orderId);

  if (!Number.isFinite(orderId) || orderId <= 0) {
    return null;
  }

  for (const base of getBaseCandidates()) {
    const backendRes = await fetch(
      `${base}/orders/${orderId}/initiate-payment?returnUrl=${encodeURIComponent(returnUrl)}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    ).catch(() => null);

    if (!backendRes) continue;

    const payload = await readJsonOrNull(backendRes);
    if (!backendRes.ok) continue;

    return payload;
  }

  return null;
}

async function postOrderV2(payload: unknown, accessToken?: string) {
  let lastStatus = 500;
  let lastPayload: unknown = null;

  for (const base of getBaseCandidates()) {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const backendRes = await fetch(`${base}/orders/v2`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
    }).catch(() => null);

    if (!backendRes) continue;

    const responsePayload = await readJsonOrNull(backendRes);
    lastStatus = backendRes.status;
    lastPayload = responsePayload;

    if (backendRes.ok) {
      return {
        ok: true as const,
        status: backendRes.status || 200,
        payload: responsePayload,
      };
    }

    if (backendRes.status === 404 || backendRes.status === 405) {
      continue;
    }

    return {
      ok: false as const,
      status: backendRes.status || 500,
      payload: responsePayload,
    };
  }

  return {
    ok: false as const,
    status: lastStatus || 500,
    payload: lastPayload,
  };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ message: "Invalid request body" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const headerToken = getTokenFromAuthHeader(req.headers.get("authorization"));
  let accessToken =
    cookieStore.get("accessToken")?.value ?? headerToken ?? undefined;

  let result = await postOrderV2(body, accessToken);

  if (!result.ok && (result.status === 401 || result.status === 403)) {
    const refreshedAccessToken = await refreshAccessToken(cookieStore);
    if (refreshedAccessToken) {
      accessToken = refreshedAccessToken;
      result = await postOrderV2(body, accessToken);
    }
  }

  if (!result.ok && accessToken && isExistingPaymentConflict(result.payload)) {
    const requestUrl = new URL(req.url);
    const returnUrl = new URL("/checkout", requestUrl.origin).toString();
    const resumedPayment = await resumePendingRedirectPayment(
      accessToken,
      returnUrl,
    );

    if (resumedPayment) {
      return Response.json(resumedPayment, { status: 200 });
    }
  }

  return Response.json(
    result.payload ??
      {
        message: result.ok
          ? "Order created successfully"
          : `Create order failed (${result.status})`,
      },
    { status: result.status },
  );
}
