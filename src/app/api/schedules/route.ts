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

function decodeJwtPayload(token?: string): Record<string, unknown> | null {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payloadJson = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(payloadJson) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readEmployeeIdFromToken(accessToken?: string): number | null {
  const payload = decodeJwtPayload(accessToken);
  const read = (v: unknown): number | null => {
    const n = typeof v === "string" ? Number(v.trim()) : Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  if (!payload) return null;

  const direct =
    payload.employeeId ??
    payload.employee_id ??
    payload.shopEmployeeId ??
    payload.shop_employee_id ??
    payload.userProfileId ??
    payload.user_profile_id ??
    payload.userId ??
    payload.user_id ??
    payload.id ??
    payload.sub;

  const id = read(direct);
  if (id) return id;

  // nested forms: { employee: { employeeId } } etc.
  const nestedEmployee =
    typeof payload.employee === "object" && payload.employee
      ? (payload.employee as Record<string, unknown>)
      : null;
  const nestedId = nestedEmployee
    ? read(
        nestedEmployee.employeeId ??
          nestedEmployee.employee_id ??
          nestedEmployee.id,
      )
    : null;
  return nestedId;
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? "0");
    const size = Number(searchParams.get("size") ?? "10");

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    if (!accessToken) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
    const qs = new URLSearchParams({
      page: String(Number.isFinite(page) ? page : 0),
      size: String(Number.isFinite(size) ? size : 10),
    });

    const beUrl = `${base}/employee/schedules?${qs.toString()}`;

    let res = await fetch(beUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    let data = await parseJsonSafely<unknown>(res);

    // Employee role may not have permission to list all schedules.
    // Fallback to "/employee/schedules/{employeeId}" when list is forbidden.
    if (!res.ok && res.status === 403) {
      const employeeId = readEmployeeIdFromToken(accessToken);
      if (!employeeId) {
        return Response.json(
          {
            code: 200,
            status: "OK",
            message: "Forbidden to list schedules; missing employeeId in token",
            data: [],
          },
          { status: 200 },
        );
      }

      if (employeeId) {
        const selfUrl = `${base}/employee/schedules/${employeeId}`;
        res = await fetch(selfUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        });
        data = await parseJsonSafely<unknown>(res);
      }
    }

    if (!res.ok) {
      // Don't bubble 403 to the client; staff accounts often cannot list schedules.
      if (res.status === 403) {
        return Response.json(
          {
            code: 200,
            status: "OK",
            message: "Forbidden to get schedules",
            data: [],
          },
          { status: 200 },
        );
      }
      const msg =
        (data as { message?: string } | null)?.message || "Get schedules failed";
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
      startTime: String(obj.startTime ?? "").trim(),
      endTime: String(obj.endTime ?? "").trim(),
      task: String(obj.task ?? "").trim(),
      isRecurring: Boolean(obj.isRecurring),
    };

    if (
      !Number.isFinite(payload.employeeId) ||
      !payload.startTime ||
      !payload.endTime ||
      !payload.task
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
    const beUrl = `${base}/employee/schedules`;

    const res = await fetch(beUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await parseJsonSafely<unknown>(res);
    if (!res.ok) {
      const msg =
        (data as { message?: string } | null)?.message ||
        "Create schedule failed";
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
