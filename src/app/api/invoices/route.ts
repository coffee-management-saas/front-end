import { ApiError } from "@/lib/utils";
import {
  createInvoice,
  getInvoices,
} from "@/services/invoices.service";
import type { InvoiceCreateInput } from "@/types/invoice";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? "0");
    const size = Number(searchParams.get("size") ?? "10");

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    const data = await getInvoices(
      {
        page: Number.isFinite(page) ? page : 0,
        size: Number.isFinite(size) ? size : 10,
      },
      accessToken,
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

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as InvoiceCreateInput | null;
    if (!body || typeof body !== "object") {
      return Response.json(
        { message: "Invalid request body" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    if (!accessToken) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const data = await createInvoice(body, accessToken);
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
