import { cookies } from "next/headers";
import envConfig from "@/config";

export async function POST(req: Request) {
  const cookieStore = await cookies();

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
    return Response.json({ message: "Thiếu refreshToken" }, { status: 401 });
  }

  // NOTE: đổi endpoint này cho khớp backend của bạn
  const BACKEND_LOGOUT_URL = `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/auth/logout`;
  // ví dụ nếu backend của bạn là /auth/logout thì dùng:
  // const BACKEND_LOGOUT_URL = `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/auth/logout`;

  const backendRes = await fetch(BACKEND_LOGOUT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const backendPayload = await backendRes.json().catch(() => null);

  // luôn xoá cookies local
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");

  if (!backendRes.ok) {
    return Response.json(
      {
        message:
          backendPayload?.message || `Logout failed (${backendRes.status})`,
      },
      { status: backendRes.status },
    );
  }

  return Response.json({ message: "Logout success" }, { status: 200 });
}
