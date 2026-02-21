import { cookies } from "next/headers";
import { ApiError } from "@/lib/utils";
import { updateStockCounts } from "@/services/stock.service";
import type { StockCheckUpdatePayload } from "@/types/stock";

export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as
      | Partial<StockCheckUpdatePayload>
      | null;

    if (!body || typeof body !== "object") {
      return Response.json(
        { message: "Invalid request body" },
        { status: 400 },
      );
    }

    const payload: StockCheckUpdatePayload = {
      sessionId: Number(body.sessionId ?? 0),
      details: Array.isArray(body.details)
        ? body.details
            .map((detail) => ({
              ingredientId: Number((detail as { ingredientId?: unknown }).ingredientId ?? 0),
              actualQuantity: Number((detail as { actualQuantity?: unknown }).actualQuantity ?? 0),
              reason: String((detail as { reason?: unknown }).reason ?? "") || null,
            }))
            .filter((d) => Number.isFinite(d.ingredientId) && d.ingredientId > 0)
        : [],
    };

    if (!Number.isFinite(payload.sessionId) || payload.sessionId <= 0) {
      return Response.json({ message: "Missing sessionId" }, { status: 400 });
    }

    if (payload.details.length === 0) {
      return Response.json({ message: "Missing details" }, { status: 400 });
    }

    const data = await updateStockCounts(payload, accessToken);
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
