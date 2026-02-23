import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { ApiError } from "@/lib/utils";
import { getVariantById, updateVariant } from "@/services/variants.service";
import type { VariantStatus } from "@/types/variants";
import envConfig from "@/config";

export const dynamic = "force-dynamic";

function parseStatus(v: string | null): VariantStatus | undefined {
  if (!v) return undefined;
  const s = v.toUpperCase();
  if (s === "ACTIVE" || s === "INACTIVE") return s;
  return undefined;
}

function getApiBase(): string {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
}

async function refreshAccessToken(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): Promise<string | null> {
  const refreshToken = cookieStore.get("refreshToken")?.value;
  if (!refreshToken) return null;
  const base = getApiBase();
  const res = await fetch(`${base}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.accessToken) return null;
  cookieStore.set("accessToken", data.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  if (data.refreshToken) {
    cookieStore.set("refreshToken", data.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
  }
  return data.accessToken;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    const data = await getVariantById(id, accessToken);
    return Response.json(
      { code: 200, status: "OK", message: "OK", data },
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return Response.json(
        { message: "Invalid request body" },
        { status: 400 },
      );
    }

    const payload = {
      productId: Number((body as { productId?: unknown }).productId),
      sizeId: Number((body as { sizeId?: unknown }).sizeId),
      price: Number((body as { price?: unknown }).price),
      costPrice: Number((body as { costPrice?: unknown }).costPrice),
      skuCode: String((body as { skuCode?: unknown }).skuCode ?? "").trim(),
      status:
        parseStatus(String((body as { status?: unknown }).status ?? "")) ??
        "ACTIVE",
    };

    if (
      !Number.isFinite(payload.productId) ||
      !Number.isFinite(payload.sizeId) ||
      !payload.skuCode
    ) {
      return Response.json(
        { message: "Missing productId, sizeId, or skuCode" },
        { status: 400 },
      );
    }
    if (
      !Number.isFinite(payload.price) ||
      !Number.isFinite(payload.costPrice)
    ) {
      return Response.json(
        { message: "Invalid price or costPrice" },
        { status: 400 },
      );
    }

    let token = accessToken;
    if (!token) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    let data: Awaited<ReturnType<typeof updateVariant>>;
    try {
      data = await updateVariant(id, payload, token);
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.status === 401 || err.status === 403)
      ) {
        const newToken = await refreshAccessToken(cookieStore);
        if (newToken) {
          data = await updateVariant(id, payload, newToken);
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }
    return Response.json(
      { code: 200, status: "OK", message: "OK", data },
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
