import { NextRequest } from "next/server";
import { ApiError } from "@/lib/utils";
import { createSize, getSizes } from "@/services/size.service";
import type { SizeStatus } from "@/types/size";

function parseStatus(v: unknown): SizeStatus | undefined {
  if (v === "ACTIVE" || v === "INACTIVE") return v;
  if (typeof v === "string") {
    const s = v.toUpperCase();
    if (s === "ACTIVE" || s === "INACTIVE") return s;
  }
  return undefined;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusRaw = searchParams.get("status");
    const status = statusRaw
      ? (statusRaw.toUpperCase() as SizeStatus)
      : undefined;

    const data = await getSizes(status);
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

    const data = await createSize(payload);
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
