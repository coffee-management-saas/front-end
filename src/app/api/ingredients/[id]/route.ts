import { cookies } from "next/headers";
import envConfig from "@/config";
import { ApiError } from "@/lib/utils";

function parseJsonSafely<T>(raw: string): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("accessToken")?.value ?? null;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return Response.json(
        { message: "Missing access token" },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
    const beUrl = `${base}/inventory/ingredients/${id}`;

    const res = await fetch(beUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const raw = await res.text();
    const data = parseJsonSafely<unknown>(raw);
    if (!res.ok) {
      return Response.json(
        { message: "BE error", payload: data, raw },
        { status: res.status },
      );
    }

    return Response.json(data ?? raw, { status: 200 });
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

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return Response.json(
        { message: "Missing access token" },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => null);
    const { id } = await context.params;
    const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
    const beUrl = `${base}/inventory/ingredients/${id}`;

    const res = await fetch(beUrl, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body ?? {}),
      cache: "no-store",
    });

    const raw = await res.text();
    const data = parseJsonSafely<unknown>(raw);
    if (!res.ok) {
      return Response.json(
        { message: "BE error", payload: data, raw },
        { status: res.status },
      );
    }

    return Response.json(data ?? raw, { status: 200 });
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
