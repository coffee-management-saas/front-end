import { cookies } from "next/headers";
import { ApiError } from "@/lib/utils";
import {
  deletePromotionById,
  getPromotionById,
  updatePromotionById,
} from "@/services/promotion.service";

type Ctx = { params: Promise<{ id: string }> };

function isAccessDeniedLike(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false;
  const msg = String(err.message ?? "").toLowerCase();
  const payloadMsg =
    err.payload && typeof err.payload === "object"
      ? String((err.payload as { message?: unknown }).message ?? "").toLowerCase()
      : "";
  const combined = `${msg} ${payloadMsg}`;
  return (
    combined.includes("access denied") ||
    combined.includes("forbidden") ||
    combined.includes("unauthorized")
  );
}

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
    const promotionId = await getParamId(req, ctx);
    if (!promotionId) {
      return Response.json({ message: "Thiếu promotionId" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    // Prefer public (no token) like homepage to avoid BE denying when Authorization is present.
    try {
      const data = await getPromotionById(promotionId, undefined);
      return Response.json(data, { status: 200 });
    } catch (publicErr) {
      if (
        publicErr instanceof ApiError &&
        (publicErr.status === 401 ||
          publicErr.status === 403 ||
          (publicErr.status === 400 && isAccessDeniedLike(publicErr)) ||
          isAccessDeniedLike(publicErr)) &&
        accessToken
      ) {
        const data = await getPromotionById(promotionId, accessToken);
        return Response.json(data, { status: 200 });
      }

      throw publicErr;
    }
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      return Response.json(
        { message: err.message, payload: err.payload },
        { status: err.status },
      );
    }

    return Response.json(
      {
        message: "Server error",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
export async function PUT(req: Request, ctx: Ctx) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const payload = await req.json().catch(() => null);

    if (!payload) {
      return Response.json({ message: "Thiếu payload" }, { status: 400 });
    }

    const promotionId = await getParamId(req, ctx);
    if (!promotionId) {
      return Response.json({ message: "Thiếu promotionId" }, { status: 400 });
    }

    const data = await updatePromotionById(promotionId, payload, accessToken);
    return Response.json(data, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      return Response.json(
        { message: err.message, payload: err.payload },
        { status: err.status },
      );
    }

    return Response.json(
      {
        message: "Server error",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const promotionId = await getParamId(req, ctx);

    if (!promotionId) {
      return Response.json({ message: "Thiếu promotionId" }, { status: 400 });
    }

    await deletePromotionById(promotionId, accessToken);

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
