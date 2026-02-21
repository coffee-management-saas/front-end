import { cookies } from "next/headers";
import { ApiError } from "@/lib/utils";
import { approveStockCheck } from "@/services/stock.service";
import type { StockCheckApprovePayload } from "@/types/stock";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as
      | Partial<StockCheckApprovePayload>
      | null;

    if (!body || typeof body !== "object") {
      return Response.json(
        { message: "Invalid request body" },
        { status: 400 },
      );
    }

    const payload: StockCheckApprovePayload = {
      sessionId: Number(body.sessionId ?? 0),
      isApproved: Boolean(body.isApproved),
      note: String(body.note ?? "").trim(),
    };

    if (!Number.isFinite(payload.sessionId) || payload.sessionId <= 0) {
      return Response.json({ message: "Missing sessionId" }, { status: 400 });
    }

    const data = await approveStockCheck(payload, accessToken);
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
