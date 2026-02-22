import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { ApiError } from "@/lib/utils";
import {
  deleteToppingById,
  getToppingById,
  updateToppingById,
} from "@/services/topping.service";
import envConfig from "@/config";

type Ctx = { params: Promise<{ id: string }> };

function getTokenFromAuthHeader(value: string | null | undefined) {
  if (!value) return undefined;
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : value;
}

async function refreshAccessToken(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  const refreshToken = cookieStore.get("refreshToken")?.value;
  if (!refreshToken) return null;

  const backendRes = await fetch(
    `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/auth/refresh`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    },
  );

  const backendData = await backendRes.json().catch(() => null);
  if (!backendRes.ok) return null;

  const newAccessToken: string | undefined = backendData?.accessToken;
  const newRefreshToken: string | undefined = backendData?.refreshToken;
  if (!newAccessToken) return null;

  cookieStore.set("accessToken", newAccessToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  if (newRefreshToken) {
    cookieStore.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return newAccessToken;
}

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const cookieStore = await cookies();
    const headerToken = getTokenFromAuthHeader(
      req.headers.get("authorization"),
    );
    const accessToken = headerToken ?? cookieStore.get("accessToken")?.value;

    const { id: idParam } = await ctx.params;
    const toppingId = Number(idParam);
    if (!Number.isFinite(toppingId)) {
      return Response.json({ message: "toppingId không hợp lệ" }, { status: 400 });
    }

    let data: Awaited<ReturnType<typeof getToppingById>>;
    try {
      data = await getToppingById(toppingId, accessToken, { viaNextApi: false });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        const refreshed = await refreshAccessToken(cookieStore);
        if (refreshed) {
          data = await getToppingById(toppingId, refreshed, { viaNextApi: false });
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

    return Response.json(
      { code: 200, status: "success", message: "Get success", data },
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

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const cookieStore = await cookies();
    const headerToken = getTokenFromAuthHeader(
      req.headers.get("authorization"),
    );
    const accessToken = headerToken ?? cookieStore.get("accessToken")?.value;

    const { id: idParam } = await ctx.params;
    const toppingId = Number(idParam);
    if (!Number.isFinite(toppingId)) {
      return Response.json({ message: "toppingId không hợp lệ" }, { status: 400 });
    }

    const body = (await req.json().catch(() => null)) as {
      name?: string;
      price?: number;
      status?: string;
    } | null;

    if (!body || (!body.name && body.price === undefined && !body.status)) {
      return Response.json(
        { message: "Thiếu dữ liệu cập nhật" },
        { status: 400 },
      );
    }

    if (body.name !== undefined && body.name.trim() === "") {
      return Response.json(
        { message: "Tên topping không hợp lệ" },
        { status: 400 },
      );
    }

    const price = body.price === undefined ? undefined : Number(body.price);
    if (price !== undefined && (!Number.isFinite(price) || price < 0)) {
      return Response.json(
        { message: "Giá topping không hợp lệ" },
        { status: 400 },
      );
    }

    if (!accessToken) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const payload = {
      name: body.name?.trim(),
      price,
      status: body.status
        ? ((body.status.trim().toUpperCase() === "INACTIVE"
          ? "INACTIVE"
          : "ACTIVE") as "ACTIVE" | "INACTIVE")
        : undefined,
    };

    let data: Awaited<ReturnType<typeof updateToppingById>>;
    try {
      data = await updateToppingById(toppingId, payload, accessToken, { viaNextApi: false });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        const refreshed = await refreshAccessToken(cookieStore);
        if (refreshed) {
          data = await updateToppingById(toppingId, payload, refreshed, { viaNextApi: false });
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

    return Response.json(
      { code: 200, status: "success", message: "Update success", data },
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

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const cookieStore = await cookies();
    const headerToken = getTokenFromAuthHeader(
      req.headers.get("authorization"),
    );
    const accessToken = headerToken ?? cookieStore.get("accessToken")?.value;

    const { id: idParam } = await ctx.params;
    const toppingId = Number(idParam);
    if (!Number.isFinite(toppingId)) {
      return Response.json({ message: "toppingId không hợp lệ" }, { status: 400 });
    }

    if (!accessToken) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    try {
      await deleteToppingById(toppingId, accessToken, { viaNextApi: false });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        const refreshed = await refreshAccessToken(cookieStore);
        if (refreshed) {
          await deleteToppingById(toppingId, refreshed, { viaNextApi: false });
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

    return Response.json({ message: "Delete success" }, { status: 200 });
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
