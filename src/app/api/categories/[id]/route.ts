import { ApiError } from "@/lib/utils";
import {
  deleteProductCategoryById,
  updateProductCategoryById,
} from "@/services/category.service";
import { cookies } from "next/headers";

type Ctx = { params: Promise<{ id: string }> };

function extractIdFromUrl(req: Request) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    return segments.at(-1) ?? "";
  } catch {
    return "";
  }
}

async function getParamId(req: Request, ctx: Ctx) {
  const params = await ctx.params;
  return params.id.toString().trim() || extractIdFromUrl(req).trim();
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const rawId = await getParamId(req, ctx);
    if (!rawId) {
      return Response.json({ message: "Thiếu categoryId" }, { status: 400 });
    }

    const categoryId = Number(rawId);
    if (!Number.isFinite(categoryId)) {
      return Response.json(
        { message: "categoryId không hợp lệ" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    await deleteProductCategoryById(categoryId, accessToken);
    return Response.json({ message: "Delete success" }, { status: 200 });
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

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const rawId = await getParamId(req, ctx);
    if (!rawId) {
      return Response.json({ message: "Thiếu categoryId" }, { status: 400 });
    }

    const categoryId = Number(rawId);
    if (!Number.isFinite(categoryId)) {
      return Response.json(
        { message: "categoryId không hợp lệ" },
        { status: 400 },
      );
    }

    const body = (await req.json().catch(() => null)) as {
      name?: string;
      status?: string;
      createdAt?: string;
    } | null;

    if (!body || (!body.name && !body.status && !body.createdAt)) {
      return Response.json(
        { message: "Thiếu dữ liệu cập nhật" },
        { status: 400 },
      );
    }

    const payload = {
      name: body.name?.trim(),
      status: body.status?.trim(),
      createdAt: body.createdAt,
    };

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    const data = await updateProductCategoryById(
      categoryId,
      payload,
      accessToken,
    );
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
