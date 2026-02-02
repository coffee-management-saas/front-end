// src/app/api/product/products/route.ts

import { ApiError } from "@/lib/utils";
import { getProducts } from "@/services/product.service";
import type { ProductFilter, ProductStatus } from "@/types/product";

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

    const data = await getProducts(filter);
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
