import { ApiError } from "@/lib/utils";
import {
  deleteToppingById,
  getToppingById,
  updateToppingById,
} from "@/services/topping.service";
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

export async function GET(req: Request, ctx: Ctx) {
  try {
    const rawId = await getParamId(req, ctx);
    if (!rawId) {
      return Response.json({ message: "Thi?u toppingId" }, { status: 400 });
    }

    const toppingId = Number(rawId);
    if (!Number.isFinite(toppingId)) {
      return Response.json(
        { message: "toppingId kh�ng h?p l?" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    const data = await getToppingById(toppingId, accessToken);
    return Response.json(
      { code: 200, status: "success", message: "Get success", data },
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

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const rawId = await getParamId(req, ctx);
    if (!rawId) {
      return Response.json({ message: "Thi?u toppingId" }, { status: 400 });
    }

    const toppingId = Number(rawId);
    if (!Number.isFinite(toppingId)) {
      return Response.json(
        { message: "toppingId kh�ng h?p l?" },
        { status: 400 },
      );
    }

    const body = (await req.json().catch(() => null)) as {
      name?: string;
      price?: number;
      status?: string;
    } | null;

    if (!body || (!body.name && body.price === undefined && !body.status)) {
      return Response.json(
        { message: "Thi?u d? li?u c?p nh?t" },
        { status: 400 },
      );
    }

    if (body.name !== undefined && body.name.trim() === "") {
      return Response.json(
        { message: "T�n topping kh�ng h?p l?" },
        { status: 400 },
      );
    }

    const price = body.price === undefined ? undefined : Number(body.price);
    if (price !== undefined && (!Number.isFinite(price) || price < 0)) {
      return Response.json(
        { message: "Gi� topping kh�ng h?p l?" },
        { status: 400 },
      );
    }

    const payload = {
      name: body.name?.trim(),
      price,
      status: body.status
        ? ((body.status.trim().toUpperCase() === "INACTIVE"
            ? "INACTIVE"
            : "ACTIVE") as "ACTIVE" | "INACTIVE")
        : undefined,
    };

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    const data = await updateToppingById(toppingId, payload, accessToken);
    return Response.json(
      { code: 200, status: "success", message: "Update success", data },
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

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const rawId = await getParamId(req, ctx);
    if (!rawId) {
      return Response.json({ message: "Thi?u toppingId" }, { status: 400 });
    }

    const toppingId = Number(rawId);
    if (!Number.isFinite(toppingId)) {
      return Response.json(
        { message: "toppingId kh�ng h?p l?" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    await deleteToppingById(toppingId, accessToken);
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
