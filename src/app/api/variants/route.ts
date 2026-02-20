import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { ApiError } from "@/lib/utils";
import { getProductVariants } from "@/services/product.service";
import { createVariant, getVariants } from "@/services/variants.service";
import type { VariantFilter, VariantStatus } from "@/types/variants";

function parseStatus(v: string | null): VariantStatus | undefined {
  if (!v) return undefined;
  const s = v.toUpperCase();
  if (s === "ACTIVE" || s === "INACTIVE") return s;
  return undefined;
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") ?? "0");
    const size = Number(searchParams.get("size") ?? "10");
    const productIdRaw = searchParams.get("productId");
    const status = parseStatus(searchParams.get("status"));

    if (!productIdRaw) {
      const data = await getProductVariants(undefined, {
        accessToken,
        viaNextApi: false,
      });
      return Response.json(data, { status: 200 });
    }

    const filter: VariantFilter = {
      page: Number.isFinite(page) ? page : 0,
      size: Number.isFinite(size) ? size : 10,
      productId: productIdRaw,
    };

    if (status) filter.status = status;

    const data = await getVariants(filter, accessToken);
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
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

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

    const data = await createVariant(payload, accessToken);
    return Response.json(
      {
        code: 201,
        status: "CREATED",
        message: "Create product variant successfully",
        data,
      },
      { status: 201 },
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
