import { cookies } from "next/headers";
import envConfig from "@/config";
import { ApiError } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

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

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    if (!id) {
      return Response.json({ message: "Thiếu id tra cứu đơn hàng" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const headerToken = getTokenFromAuthHeader(req.headers.get("authorization"));
    const accessToken = headerToken ?? cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
    const beUrl = `${base}/orders/v2/${encodeURIComponent(id)}`;

    const res = await fetch(beUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const payload = await parseJsonSafely(res);

    if (!res.ok) {
      throw new ApiError("BE error", res.status, payload);
    }

    return Response.json(payload ?? {}, { status: 200 });
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
