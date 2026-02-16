import { ApiError } from "@/lib/utils";
import { getToppings } from "@/services/topping.service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") ?? "0");
    const size = Number(searchParams.get("size") ?? "200");

    const data = await getToppings({
      page: Number.isFinite(page) ? page : 0,
      size: Number.isFinite(size) ? size : 200,
    });

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
