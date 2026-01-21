import { cookies } from "next/headers";
import envConfig from "@/config";

// decode exp từ accessToken (server-side)
function getExpiresAtFromJwt(accessToken: string): string {
  try {
    const parts = accessToken.split(".");
    if (parts.length < 2) return "";
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    );
    if (!payload?.exp) return "";
    return new Date(payload.exp * 1000).toISOString();
  } catch {
    return "";
  }
}

export async function POST() {
  const cookieStore = await cookies();

  const refreshToken = cookieStore.get("refreshToken")?.value;
  if (!refreshToken) {
    return Response.json({ message: "Thiếu refreshToken" }, { status: 401 });
  }

  // GỌI BACKEND REFRESH
  // Bạn cần đảm bảo backend có endpoint refresh (ví dụ /auth/refresh)
  const backendRes = await fetch(
    `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/auth/refresh`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    },
  );

  const backendData = await backendRes.json().catch(() => null);

  if (!backendRes.ok) {
    return Response.json(
      {
        message:
          backendData?.message || `Refresh failed (${backendRes.status})`,
      },
      { status: backendRes.status },
    );
  }

  const newAccessToken: string | undefined = backendData?.accessToken;
  const newRefreshToken: string | undefined = backendData?.refreshToken; // nếu backend rotate

  if (!newAccessToken) {
    return Response.json(
      { message: "Backend không trả accessToken" },
      { status: 500 },
    );
  }

  // SET COOKIE MỚI (httpOnly) trên Next domain
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

  const expiresAt = getExpiresAtFromJwt(newAccessToken);

  // Trả về cho Client cập nhật context (khuyến nghị KHÔNG trả refreshToken)
  return Response.json(
    {
      data: {
        accessToken: newAccessToken,
        expiresAt,
      },
    },
    { status: 200 },
  );
}
