// src/app/api/product/products/route.ts

import { ApiError } from "@/lib/utils";
import { createProduct, getProducts } from "@/services/product.service";
import type { ProductFilter, ProductStatus } from "@/types/product";
import { cookies } from "next/headers";

function parseStatus(v: string | null): ProductStatus | undefined {
  if (v === "ACTIVE" || v === "INACTIVE") return v;
  return undefined;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") ?? "0");
    const size = Number(searchParams.get("size") ?? "10");
    const categoryIdRaw = searchParams.get("categoryId");
    const status = parseStatus(searchParams.get("status"));

    const filter: ProductFilter = {
      page: Number.isFinite(page) ? page : 0,
      size: Number.isFinite(size) ? size : 10,
    };

    if (categoryIdRaw) {
      const categoryId = Number(categoryIdRaw);
      if (Number.isFinite(categoryId)) filter.categoryId = categoryId;
    }
    if (status) filter.status = status;

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    const data = await getProducts(filter, {
      accessToken,
      viaNextApi: false,
    });
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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return Response.json({ message: "Invalid request body" }, { status: 400 });
    }

    const payload = {
      name: String(body.name ?? "").trim(),
      categoryId: Number(body.categoryId),
      description:
        body.description === null || body.description === undefined
          ? null
          : String(body.description),
      image:
        body.image === null || body.image === undefined
          ? null
          : String(body.image),
      status: parseStatus(body.status) ?? "ACTIVE",
    };

    if (!payload.name || !Number.isFinite(payload.categoryId)) {
      return Response.json(
        { message: "Missing name or categoryId" },
        { status: 400 },
      );
    }

    const data = await createProduct(payload);
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
