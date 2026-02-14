import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { ApiError } from "@/lib/utils";
import { getVariantById, updateVariant } from "@/services/variants.service";
import type { VariantStatus } from "@/types/variants";

function parseStatus(v: string | null): VariantStatus | undefined {
  if (!v) return undefined;
  const s = v.toUpperCase();
  if (s === "ACTIVE" || s === "INACTIVE") return s;
  return undefined;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isFinite(id)) {
      return Response.json({ message: "Invalid id" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return Response.json(
        { message: "Invalid request body" },
        { status: 400 },
      );
    }

    const productIdRaw = (body as { productId?: unknown }).productId;
    const sizeIdRaw = (body as { sizeId?: unknown }).sizeId;
    const productId = Number(productIdRaw);
    const sizeId = Number(sizeIdRaw);
    const price = Number((body as { price?: unknown }).price);
    const costPrice = Number((body as { costPrice?: unknown }).costPrice);
    const skuCode = String(
      (body as { skuCode?: unknown }).skuCode ?? "",
    ).trim();
    const status =
      parseStatus(String((body as { status?: unknown }).status ?? "")) ??
      "ACTIVE";

    const payload = {
      productId,
      sizeId,
      price,
      costPrice,
      skuCode,
      status,
    };

    if (!Number.isFinite(productId) || !Number.isFinite(sizeId) || !skuCode) {
      return Response.json(
        { message: "Missing productId, sizeId, or skuCode" },
        { status: 400 },
      );
    }
    if (!Number.isFinite(price) || !Number.isFinite(costPrice)) {
      return Response.json(
        { message: "Invalid price or costPrice" },
        { status: 400 },
      );
    }

    const data = await updateVariant(id, payload, accessToken);
    return Response.json(
      {
        code: 200,
        status: "OK",
        message: "Update product variant successfully",
        data,
      },
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isFinite(id)) {
      return Response.json({ message: "Invalid id" }, { status: 400 });
    }

    const data = await getVariantById(id, accessToken);
    return Response.json(
      {
        code: 200,
        status: "OK",
        message: "Get variant detail successfully",
        data,
      },
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
