import { cookies } from "next/headers";
import envConfig from "@/config";
import { ApiError } from "@/lib/utils";
import { createPromotion, getPromotions } from "@/services/promotion.service";

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

function isAccessDeniedLike(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false;
  const msg = String(err.message ?? "").toLowerCase();
  const payloadMsg =
    err.payload && typeof err.payload === "object"
      ? String((err.payload as { message?: unknown }).message ?? "").toLowerCase()
      : "";
  const combined = `${msg} ${payloadMsg}`;
  return (
    combined.includes("access denied") ||
    combined.includes("forbidden") ||
    combined.includes("unauthorized")
  );
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

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const headerToken = getTokenFromAuthHeader(
      req.headers.get("authorization"),
    );
    let accessToken = headerToken ?? cookieStore.get("accessToken")?.value;
    const hasCookieToken = Boolean(cookieStore.get("accessToken")?.value);
    const hasHeaderToken = Boolean(headerToken);
    const tokenInfo = decodeJwtPayload(accessToken);

    // Ưu tiên gọi public (không token) để tránh BE chặn khi có Authorization
    try {
      const data = await getPromotions(undefined);
      return Response.json(data, { status: 200 });
    } catch (publicErr) {
      if (publicErr instanceof ApiError) {
        console.warn(
          "[/api/promotion] Public attempt failed",
          JSON.stringify({
            status: publicErr.status,
            payload: publicErr.payload ?? null,
          }),
        );
      }

      // Nếu public bị chặn, thử gọi có token
      if (
        publicErr instanceof ApiError &&
        (publicErr.status === 401 ||
          publicErr.status === 403 ||
          (publicErr.status === 400 && isAccessDeniedLike(publicErr)) ||
          isAccessDeniedLike(publicErr)) &&
        accessToken
      ) {
        try {
          const data = await getPromotions(accessToken);
          return Response.json(data, { status: 200 });
        } catch (authErr) {
          if (
            authErr instanceof ApiError &&
            (authErr.status === 401 || authErr.status === 403)
          ) {
            console.warn(
              "[/api/promotion] Auth attempt failed",
              JSON.stringify({
                status: authErr.status,
                hasHeaderToken,
                hasCookieToken,
                tokenPrefix: accessToken ? accessToken.slice(0, 12) : null,
                tokenExp: tokenInfo?.exp ?? null,
                tokenRole: tokenInfo?.role ?? null,
              }),
            );
            const refreshed = await refreshAccessToken(cookieStore);
            if (refreshed) {
              accessToken = refreshed;
              const data = await getPromotions(accessToken);
              return Response.json(data, { status: 200 });
            }
          }
          throw authErr;
        }
      }
      throw publicErr;
    }
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

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const payload = await req.json().catch(() => null);

    if (!payload) {
      return Response.json({ message: "Thiếu payload" }, { status: 400 });
    }

    const data = await createPromotion(payload, accessToken);
    return Response.json(data, { status: 201 });
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
