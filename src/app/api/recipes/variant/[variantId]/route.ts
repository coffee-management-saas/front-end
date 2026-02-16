import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { ApiError } from "@/lib/utils";
import { getRecipesByVariant } from "@/services/recipes.service";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ variantId?: string }> },
) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const { variantId: paramVariantId } = await context.params;
    const rawParam = paramVariantId ?? searchParams.get("variantId");
    const variantId = Number(String(rawParam ?? "").trim());
    if (!Number.isFinite(variantId) || variantId <= 0) {
      return Response.json({ message: "Invalid variantId" }, { status: 400 });
    }

    const data = await getRecipesByVariant(variantId, accessToken);
    return Response.json({ code: 200, data }, { status: 200 });
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
