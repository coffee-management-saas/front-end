// app/api/product/toppings/route.ts

import { ApiError } from "@/lib/utils";
import { createTopping, getToppings } from "@/services/topping.service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") ?? "0");
    const size = Number(searchParams.get("size") ?? "10");

    const data = await getToppings({ page, size });
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

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      name?: string;
      price?: number;
      status?: string;
    } | null;

    if (!body?.name || body.name.trim() === "") {
      return Response.json({ message: "Thiếu tên topping" }, { status: 400 });
    }

    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      return Response.json(
        { message: "Giá topping không hợp lý" },
        { status: 400 },
      );
    }

    const payload = {
      name: body.name.trim(),
      price,
      status: (body.status?.trim().toUpperCase() === "INACTIVE"
        ? "INACTIVE"
        : "ACTIVE") as "ACTIVE" | "INACTIVE",
    };

    const data = await createTopping(payload);
    return Response.json(
      { code: 201, status: "success", message: "Create success", data },
      { status: 201 },
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
