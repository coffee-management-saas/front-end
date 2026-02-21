import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import envConfig from "@/config";
import { ApiError } from "@/lib/utils";
import { createShopEmployee } from "@/services/employee.service";
import type { CreateShopEmployeeRequest } from "@/types/employee";

function getTokenFromAuthHeader(value: string | null | undefined) {
  if (!value) return undefined;
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : value;
}

function decodeJwtPayload(accessToken?: string) {
  if (!accessToken) return null;
  const parts = accessToken.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    ) as Record<string, unknown>;
    const exp = typeof payload.exp === "number" ? payload.exp : null;
    const role =
      payload.role ??
      (Array.isArray(payload.roles) ? payload.roles[0] : null) ??
      (Array.isArray(payload.authorities) ? payload.authorities[0] : null);
    return { exp, role };
  } catch {
    return null;
  }
}

async function refreshAccessToken(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  const refreshToken = cookieStore.get("refreshToken")?.value;
  if (!refreshToken) return null;

  const backendRes = await fetch(
    `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/auth/refresh`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    },
  );

  const backendData = await backendRes.json().catch(() => null);

  if (!backendRes.ok) {
    return null;
  }

  const newAccessToken: string | undefined = backendData?.accessToken;
  const newRefreshToken: string | undefined = backendData?.refreshToken;

  if (!newAccessToken) return null;

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

export async function POST(req: NextRequest) {
  let hasCookieToken = false;
  let hasHeaderToken = false;
  let accessToken: string | undefined;
  let tokenInfo: { exp: number | null; role: unknown } | null = null;
  let bodyPayload: CreateShopEmployeeRequest | null = null;
  try {
    const cookieStore = await cookies();
    const headerToken = getTokenFromAuthHeader(
      req.headers.get("authorization"),
    );
    accessToken = headerToken ?? cookieStore.get("accessToken")?.value;
    tokenInfo = decodeJwtPayload(accessToken);
    hasCookieToken = Boolean(cookieStore.get("accessToken")?.value);
    hasHeaderToken = Boolean(headerToken);

    if (!accessToken) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const body = (await req
      .json()
      .catch(() => null)) as CreateShopEmployeeRequest | null;
    bodyPayload = body;

    if (!body) {
      return Response.json({ message: "Thieu du lieu" }, { status: 400 });
    }

    const data = await createShopEmployee(body, {
      accessToken,
      viaNextApi: false,
    });

    return Response.json(data ?? null, { status: 201 });
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401 || err.status === 403) {
        try {
          const cookieStore = await cookies();
          const refreshed = await refreshAccessToken(cookieStore);
          if (refreshed) {
            accessToken = refreshed;
            tokenInfo = decodeJwtPayload(accessToken);
            if (bodyPayload) {
              const data = await createShopEmployee(bodyPayload, {
                accessToken,
                viaNextApi: false,
              });
              return Response.json(data ?? null, { status: 201 });
            }
          }
        } catch {
          // ignore refresh errors, fall through to error response
        }
      }
      const debug =
        err.status === 401 || err.status === 403
          ? {
              hasCookieToken,
              hasHeaderToken,
              tokenPrefix: accessToken ? accessToken.slice(0, 12) : null,
              tokenExp: tokenInfo?.exp ?? null,
              tokenRole: tokenInfo?.role ?? null,
            }
          : undefined;
      return Response.json(
        {
          message: err.message,
          payload: err.payload ?? null,
          ...(debug ? { debug } : {}),
        },
        { status: err.status },
      );
    }
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
