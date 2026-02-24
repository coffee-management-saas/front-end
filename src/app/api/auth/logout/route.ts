import { cookies } from "next/headers";
import envConfig from "@/config";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  let refreshToken: string | undefined;
  try {
    const body = await req.json().catch(() => null);
    refreshToken = body?.refreshToken;
  } catch {}

  if (!refreshToken) {
    refreshToken = cookieStore.get("refreshToken")?.value;
  }

  if (!refreshToken) {
    // vẫn xoá local cookies cho chắc
    cookieStore.delete("accessToken");
    cookieStore.delete("refreshToken");
    // Logout is best-effort: if tokens are already missing/expired, still treat as success.
    return Response.json({ message: "Logout success" }, { status: 200 });
  }

  // NOTE: đổi endpoint này cho khớp backend của bạn
  const BACKEND_LOGOUT_URL = `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/auth/logout`;
  // ví dụ nếu backend của bạn là /auth/logout thì dùng:
  // const BACKEND_LOGOUT_URL = `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/auth/logout`;

  try {
    const backendRes = await fetch(BACKEND_LOGOUT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ refreshToken }),
    });

    // read & ignore backend response (some backends return 400/401 for expired refresh token)
    await backendRes.text().catch(() => "");
  } catch {
    // ignore backend errors, logout is still considered successful locally
  } finally {
    // luôn xoá cookies local
    cookieStore.delete("accessToken");
    cookieStore.delete("refreshToken");
  }

  return Response.json({ message: "Logout success" }, { status: 200 });
}
