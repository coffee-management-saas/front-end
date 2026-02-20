import { cookies } from "next/headers";
import envConfig from "@/config";
import { ApiError } from "@/lib/utils";
import { UpdateProfileBody } from "@/types/profile";

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

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const headerToken = getTokenFromAuthHeader(req.headers.get("authorization"));
    const accessToken = headerToken ?? cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
    const beUrl = `${base}/customers/me`;

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
export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const headerToken = getTokenFromAuthHeader(req.headers.get("authorization"));
    const accessToken = headerToken ?? cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const body = (await req
      .json()
      .catch(() => null)) as UpdateProfileBody | null;
    if (!body) {
      return Response.json({ message: "Body không hợp lệ" }, { status: 400 });
    }

    const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
    const beUrl = `${base}/customers/me`;

    const res = await fetch(beUrl, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
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
