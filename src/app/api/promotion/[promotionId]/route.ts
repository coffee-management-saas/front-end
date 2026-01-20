import { ApiError } from "@/lib/utils";
import { getPromotionById } from "@/services/promotion.service";

export async function GET(
  _req: Request,
  { params }: { params: { promotionId: string } },
) {
  try {
    const data = await getPromotionById(params.promotionId);
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
