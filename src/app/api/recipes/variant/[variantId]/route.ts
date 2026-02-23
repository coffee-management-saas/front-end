import { ApiError } from "@/lib/utils";
import { getRecipesByVariant } from "@/services/recipes.service";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ variantId: string }> },
) {
  try {
    const { variantId } = await params;
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    const data = await getRecipesByVariant(variantId, accessToken);
    return Response.json(
      { code: 200, status: "OK", message: "OK", data },
      { status: 200 },
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
