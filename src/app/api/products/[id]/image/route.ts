import { cookies } from "next/headers";
import envConfig from "@/config";
import { ApiError } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

function extractIdFromUrl(req: Request) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    return segments.at(-2) ?? "";
  } catch {
    return "";
  }
}

async function getParamId(req: Request, ctx: Ctx) {
  const params = await ctx.params;
  return params.id.toString().trim() || extractIdFromUrl(req).trim();
}

async function parseJsonSafely(res: Response): Promise<unknown> {
  const raw = await res.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const productId = await getParamId(req, ctx);
    if (!productId) {
      return Response.json({ message: "Thiếu productId" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    if (!accessToken) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const incoming = await req.formData();
    const image = incoming.get("image");
    if (!image || !(image instanceof File)) {
      return Response.json({ message: "Thiếu file ảnh" }, { status: 400 });
    }

    const formData = new FormData();
    formData.append("image", image);

    const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
    const beUrl = `${base}/products/${productId}/image`;

    const res = await fetch(beUrl, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
      cache: "no-store",
    });

    const payload = await parseJsonSafely(res);

    if (!res.ok) {
      throw new ApiError("BE error", res.status, payload);
    }

    return Response.json(payload ?? { message: "Upload success" }, {
      status: 200,
    });
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

