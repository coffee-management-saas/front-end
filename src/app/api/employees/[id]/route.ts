import { cookies } from "next/headers";
import { ApiError } from "@/lib/utils";
import {
  deleteEmployeeById,
  getEmployeeById,
  updateEmployeeById,
} from "@/services/employee.service";
import type { EmployeeType } from "@/types/employee";

export const dynamic = "force-dynamic";

function parseEmployeeType(v: unknown): EmployeeType {
  const raw = String(v ?? "").trim().toUpperCase();
  if (raw === "FULL_TIME" || raw === "PART_TIME" || raw === "TEMPORARY") {
    return raw;
  }
  return raw;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    const data = await getEmployeeById(id, { accessToken, viaNextApi: false });

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

    const payload = {
      userProfileId: Number(payloadObj.userProfileId),
      employeeType: parseEmployeeType(payloadObj.employeeType),
      hourlyWage: Number(payloadObj.hourlyWage),
      weeklyHourLimit: Number(payloadObj.weeklyHourLimit),
    };

    if (
      !Number.isFinite(payload.userProfileId) ||
      !payload.employeeType ||
      !Number.isFinite(payload.hourlyWage) ||
      !Number.isFinite(payload.weeklyHourLimit)
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

    const data = await updateEmployeeById(id, payload, {
      accessToken,
      viaNextApi: false,
    });

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

    await deleteEmployeeById(id, { accessToken, viaNextApi: false });

    return Response.json(
      { code: 200, status: "OK", message: "OK" },
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
