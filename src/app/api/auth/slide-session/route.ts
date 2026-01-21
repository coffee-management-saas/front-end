import { cookies } from "next/headers";

function getExpiresAtFromJwtServer(accessToken: string): string {
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

  // GỌI BACKEND để refresh token (đổi endpoint cho đúng backend của bạn)
  const backendRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_ENDPOINT}/auth/refresh`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    },
  );

  const backendData = await backendRes.json().catch(() => null);

  if (!backendRes.ok) {
    return Response.json(
      { message: backendData?.message || "Refresh token failed" },
      { status: backendRes.status },
    );
  }

  const newAccessToken = backendData?.accessToken;
  const newRefreshToken = backendData?.refreshToken; // nếu backend rotate
  if (!newAccessToken) {
    return Response.json(
      { message: "Backend không trả accessToken" },
      { status: 500 },
    );
  }

  // set cookie mới
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

  const expiresAt = getExpiresAtFromJwtServer(newAccessToken);

  // Trả về để Next Client cập nhật context (nếu bạn muốn an toàn hơn: không trả refreshToken)
  return Response.json(
    {
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt,
      },
    },
    { status: 200 },
  );
}
