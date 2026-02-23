import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import envConfig from "@/config";
import { ApiError } from "@/lib/utils";

async function parseJsonSafely<T>(res: Response): Promise<T | null> {
  const raw = await res.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? "0");
    const size = Number(searchParams.get("size") ?? "100");

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    if (!accessToken) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
    const qs = new URLSearchParams({
      page: String(Number.isFinite(page) ? page : 0),
      size: String(Number.isFinite(size) ? size : 100),
    });
    const beUrl = `${base}/employee/unavailability?${qs.toString()}`;

    const res = await fetch(beUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const data = await parseJsonSafely<unknown>(res);
    if (!res.ok) {
      const msg =
        (data as { message?: string } | null)?.message ||
        "Get unavailability failed";
      throw new ApiError(msg, res.status, data);
    }

    return Response.json(data, { status: 200 });
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return Response.json({ message: "Invalid request body" }, { status: 400 });
    }

    const obj = body as Record<string, unknown>;
    const payload = {
      employeeId: Number(obj.employeeId),
      reason: String(obj.reason ?? "").trim(),
      startTime: String(obj.startTime ?? "").trim(),
      endTime: String(obj.endTime ?? "").trim(),
      specificDate: String(obj.specificDate ?? "").trim(),
      isRecurring: Boolean(obj.isRecurring),
      status: obj.status != null ? String(obj.status).trim() : undefined,
    };

    if (
      !Number.isFinite(payload.employeeId) ||
      !payload.reason ||
      !payload.startTime ||
      !payload.endTime ||
      !payload.specificDate
    ) {
      return Response.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    if (!accessToken) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
    const beUrl = `${base}/employee/unavailability`;

    const res = await fetch(beUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await parseJsonSafely<unknown>(res);
    if (!res.ok) {
      const msg =
        (data as { message?: string } | null)?.message ||
        "Create unavailability failed";
      throw new ApiError(msg, res.status, data);
    }

    return Response.json(data, { status: res.status });
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

