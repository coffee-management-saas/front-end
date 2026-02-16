import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { ApiError } from "@/lib/utils";
import { getInvoiceById } from "@/services/invoices.service";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    const data = await getInvoiceById(id, accessToken);
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
