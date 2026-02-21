import { cookies } from "next/headers";
import { ApiError } from "@/lib/utils";
import { startStockCheck } from "@/services/stock.service";
import type { StockCheckStartPayload } from "@/types/stock";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as
      | Partial<StockCheckStartPayload>
      | null;

    if (!body || typeof body !== "object") {
      return Response.json(
        { message: "Invalid request body" },
        { status: 400 },
      );
    }

    const payload: StockCheckStartPayload = {
      code: String(body.code ?? "").trim(),
      note: String(body.note ?? "").trim(),
      ingredientIds: Array.isArray(body.ingredientIds)
        ? body.ingredientIds.map((id) => Number(id)).filter(Number.isFinite)
        : [],
    };

    if (!payload.code) {
      return Response.json({ message: "Missing code" }, { status: 400 });
    }

    if (payload.ingredientIds.length === 0) {
      return Response.json(
        { message: "Missing ingredientIds" },
        { status: 400 },
      );
    }

    const data = await startStockCheck(payload, accessToken);
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
