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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const scheduleId = Number(id);
    if (!Number.isFinite(scheduleId)) {
      return Response.json({ message: "Invalid id" }, { status: 400 });
    }

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
    const beUrl = `${base}/employee/schedules/${scheduleId}`;

    const res = await fetch(beUrl, {
      method: "PUT",
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
        (data as { message?: string } | null)?.message || "Update schedule failed";
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const scheduleId = Number(id);
    if (!Number.isFinite(scheduleId)) {
      return Response.json({ message: "Invalid id" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    if (!accessToken) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
    const beUrl = `${base}/employee/schedules/${scheduleId}`;

    const res = await fetch(beUrl, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (res.status === 204) {
      return Response.json(
        { code: 200, status: "OK", message: "OK" },
        { status: 200 },
      );
    }

    const data = await parseJsonSafely<unknown>(res);
    if (!res.ok) {
      const msg =
        (data as { message?: string } | null)?.message ||
        "Delete schedule failed";
      throw new ApiError(msg, res.status, data);
    }

    return Response.json(
      data ?? { code: 200, status: "OK", message: "OK" },
      { status: 200 },
    );
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
