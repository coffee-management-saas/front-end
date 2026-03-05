import { cookies } from "next/headers";
import { ApiError } from "@/lib/utils";
import {
  deleteCustomerById,
  getCustomerById,
  updateCustomerById,
} from "@/services/customer.service";
import type { UpdateCustomerInput } from "@/types/customer";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    const data = await getCustomerById(id, { accessToken, viaNextApi: false });

    return Response.json(
      {
        code: 200,
        status: "OK",
        message: "Lấy chi tiết khách hàng thành công",
        data,
      },
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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const payloadRaw = await req.json().catch(() => null);
    if (!payloadRaw || typeof payloadRaw !== "object") {
      return Response.json({ message: "Invalid request body" }, { status: 400 });
    }
    const payloadObj = payloadRaw as Record<string, unknown>;

    const payload: UpdateCustomerInput = {
      fullname: String(payloadObj.fullname ?? "").trim(),
      phone: String(payloadObj.phone ?? "").trim(),
      email: String(payloadObj.email ?? "").trim(),
      address: String(payloadObj.address ?? "").trim(),
      dob: String(payloadObj.dob ?? "").trim(),
    };

    if (
      !payload.fullname ||
      !payload.phone ||
      !payload.email ||
      !payload.address ||
      !payload.dob
    ) {
      return Response.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    if (!accessToken) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const data = await updateCustomerById(id, payload, {
      accessToken,
      viaNextApi: false,
    });

    return Response.json(
      { code: 200, status: "OK", message: "Cập nhật khách hàng thành công", data },
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    if (!accessToken) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    await deleteCustomerById(id, { accessToken, viaNextApi: false });

    return Response.json(
      { code: 200, status: "OK", message: "Xóa khách hàng thành công" },
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
