import { ApiError } from "@/lib/utils";
import { getPromotions } from "@/services/promotion.service";

export async function GET() {
  try {
    const data = await getPromotions();
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
