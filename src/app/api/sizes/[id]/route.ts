import { cookies } from "next/headers";
import { ApiError, getJwtExpiresAt } from "@/lib/utils";
import { deleteSize, updateSize } from "@/services/size.service";
import type { SizeStatus } from "@/types/size";

function parseStatus(v: unknown): SizeStatus | undefined {
  if (
    v === "ACTIVE" ||
    v === "INACTIVE" ||
    v === "OUTOFSTOCK" ||
    v === "DELETED"
  )
    return v;
  if (typeof v === "string") {
    const s = v.toUpperCase();
    if (
      s === "ACTIVE" ||
      s === "INACTIVE" ||
      s === "OUTOFSTOCK" ||
      s === "DELETED"
    )
      return s;
  }
  return undefined;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return Response.json(
        { message: "Invalid request body" },
        { status: 400 },
      );
    }

    const payload = {
      code: String((body as { code?: unknown }).code ?? "").trim(),
      status: parseStatus((body as { status?: unknown }).status) ?? "ACTIVE",
    };

    if (!payload.code) {
      return Response.json({ message: "Missing code" }, { status: 400 });
    }

    const data = await updateSize(id, payload, accessToken);
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
  const { id } = await params;
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(
        "[sizes:DELETE] id=%s token_exp=%s token_prefix=%s",
        id,
        getJwtExpiresAt(accessToken) || "unknown",
        accessToken.slice(0, 12),
      );
    }

    await deleteSize(id, accessToken);
    return Response.json({ message: "Deleted" }, { status: 200 });
  } catch (err) {
    if (err instanceof ApiError) {
      if (process.env.NODE_ENV !== "production") {
        console.log(
          "[sizes:DELETE] BE error status=%s payload=%s",
          err.status,
          JSON.stringify(err.payload ?? null),
        );
      }
      return Response.json(
        { message: err.message, payload: err.payload },
        { status: err.status },
      );
    }
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
