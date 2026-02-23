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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  try {
    const { employeeId } = await params;
    const id = Number(employeeId);
    if (!Number.isFinite(id)) {
      return Response.json({ message: "Invalid employeeId" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    if (!accessToken) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
    const beUrl = `${base}/employee/schedules/${id}`;

    const res = await fetch(beUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const data = await parseJsonSafely<unknown>(res);
    if (res.ok) {
      return Response.json(data, { status: 200 });
    }

    // Fallback: some BE configs forbid /schedules/{employeeId} but allow list.
    // If list works, filter locally by employeeId to keep the UI functional.
    if (res.status === 401 || res.status === 403) {
      const qs = new URLSearchParams({ page: "0", size: "1000" });
      const listUrl = `${base}/employee/schedules?${qs.toString()}`;
      const listRes = await fetch(listUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

      const listData = await parseJsonSafely<unknown>(listRes);
      if (listRes.ok) {
        const listObj = listData as
          | { code?: number; data?: Array<{ employeeId?: number }> }
          | null;
        const filtered =
          Array.isArray(listObj?.data)
            ? listObj.data.filter((s) => Number(s.employeeId) === id)
            : [];
        return Response.json(
          { code: 200, status: "OK", message: "OK", data: filtered },
          { status: 200 },
        );
      }
    }

    const msg =
      (data as { message?: string } | null)?.message ||
      "Get schedules by employee failed";
    throw new ApiError(msg, res.status, data);
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
