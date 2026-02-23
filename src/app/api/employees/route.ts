import { cookies } from "next/headers";
import { ApiError } from "@/lib/utils";
import { createEmployee, getEmployees } from "@/services/employee.service";
import type { EmployeeType } from "@/types/employee";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? "0");
    const size = Number(searchParams.get("size") ?? "10");

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    const data = await getEmployees(
      {
        page: Number.isFinite(page) ? page : 0,
        size: Number.isFinite(size) ? size : 10,
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

function parseEmployeeType(v: unknown): EmployeeType {
  const raw = String(v ?? "").trim().toUpperCase();
  if (raw === "FULL_TIME" || raw === "PART_TIME" || raw === "TEMPORARY") {
    return raw;
  }
  return raw;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return Response.json({ message: "Invalid request body" }, { status: 400 });
    }

    const bodyObj = body as Record<string, unknown>;
    const payload = {
      username: String(bodyObj.username ?? "").trim(),
      password: String(bodyObj.password ?? "").trim(),
      fullname: String(bodyObj.fullname ?? "").trim(),
      email: String(bodyObj.email ?? "").trim(),
      phone: String(bodyObj.phone ?? "").trim(),
      address: String(bodyObj.address ?? "").trim(),
      dob: String(bodyObj.dob ?? "").trim(),
      employeeType: parseEmployeeType(bodyObj.employeeType),
      hourlyWage: Number(bodyObj.hourlyWage),
      weeklyHourLimit: Number(bodyObj.weeklyHourLimit),
    };

    if (
      !payload.username ||
      !payload.password ||
      !payload.fullname ||
      !payload.email ||
      !payload.phone ||
      !payload.address ||
      !payload.dob ||
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

    const data = await createEmployee(payload, {
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
