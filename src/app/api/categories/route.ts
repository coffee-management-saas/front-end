// src/app/api/product/categories/route.ts
import { NextRequest } from "next/server";
import { ApiError } from "@/lib/utils";
import {
  createProductCategory,
  getProductCategories,
} from "@/services/category.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") ?? "0");
    const size = Number(searchParams.get("size") ?? "10");

    const data = await getProductCategories({ page, size });
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
    const body = (await req.json().catch(() => null)) as {
      name?: string;
      status?: string;
      createdAt?: string;
    } | null;

    if (!body?.name || body.name.trim() === "") {
      return Response.json({ message: "Thiếu tên danh mục" }, { status: 400 });
    }

    const payload = {
      name: body.name.trim(),
      status: body.status?.trim(),
      createdAt: body.createdAt,
    };

    const data = await createProductCategory(payload);
    return Response.json(data, { status: 201 });
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
