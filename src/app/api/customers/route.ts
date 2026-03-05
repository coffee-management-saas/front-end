import { cookies } from "next/headers";
import { ApiError } from "@/lib/utils";
import { getCustomers } from "@/services/customer.service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? "0");
    const size = Number(searchParams.get("size") ?? "100");

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    const data = await getCustomers(
      {
        page: Number.isFinite(page) ? page : 0,
        size: Number.isFinite(size) ? size : 100,
      },
      { accessToken, viaNextApi: false },
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

