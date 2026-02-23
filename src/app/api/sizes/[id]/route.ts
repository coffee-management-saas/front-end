import { ApiError } from "@/lib/utils";
import { deleteSize, updateSize } from "@/services/size.service";
import type { SizeStatus, UpdateSizePayload } from "@/types/size";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

function parseStatus(v: string | null): SizeStatus {
  const s = (v ?? "ACTIVE").toUpperCase();
  if (s === "INACTIVE" || s === "OUTOFSTOCK" || s === "DELETED") return s as SizeStatus;
  return "ACTIVE";
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    if (!accessToken) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as UpdateSizePayload | null;
    if (!body || typeof body !== "object") {
      return Response.json(
        { message: "Invalid request body" },
        { status: 400 },
      );
    }

    const code = String(body.code ?? "").trim().toUpperCase();
    const status = parseStatus(body.status ?? "ACTIVE");
    if (!code) {
      return Response.json(
        { message: "Vui lòng nhập mã size" },
        { status: 400 },
      );
    }

    const data = await updateSize(id, { code, status }, accessToken);
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    if (!accessToken) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    await deleteSize(id, accessToken);
    return Response.json({ message: "OK" }, { status: 200 });
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
