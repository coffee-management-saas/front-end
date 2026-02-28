import { ApiError } from "@/lib/utils";
import { getBestSellers } from "@/services/product.service";
import { cookies } from "next/headers";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = Number(searchParams.get("limit") ?? "10");

        const cookieStore = await cookies();
        const accessToken = cookieStore.get("accessToken")?.value;

        const data = await getBestSellers(limit, {
            accessToken,
            viaNextApi: false,
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
