import { cookies } from "next/headers";

export async function POST(request: Request) {
  const body = await request.json();
  const accessToken = body.accessToken;
  const refreshToken = body.refreshToken;

  if (!accessToken) {
    return Response.json({ message: "Thiếu accessToken" }, { status: 400 });
  }

  const cookieStore = await cookies();

  cookieStore.set("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // secure: process.env.NODE_ENV === "production",
    secure: false,
  });

  if (refreshToken) {
    cookieStore.set("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      // secure: process.env.NODE_ENV === "production",
      secure: false,
    });
  }

  return Response.json({ message: "Set cookie success" }, { status: 200 });
}
