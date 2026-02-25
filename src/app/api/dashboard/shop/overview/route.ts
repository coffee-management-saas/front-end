import envConfig from "@/config";
import { cookies } from "next/headers";

function getBaseCandidates(): string[] {
  const raw = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const candidates = [raw];

  if (raw.endsWith("/api")) {
    candidates.push(raw.slice(0, -4));
  } else {
    candidates.push(`${raw}/api`);
  }

  return Array.from(new Set(candidates)).filter(Boolean);
}

async function readJsonOrNull(res: Response): Promise<unknown | null> {
  const text = await res.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: "Backend returned non-JSON response", raw: text };
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filterRaw = searchParams.get("filter");

  let fromDate = "";
  let toDate = "";
  let topProductsLimit = 5;

  if (filterRaw) {
    try {
      const parsed = JSON.parse(filterRaw) as unknown;
      if (parsed && typeof parsed === "object") {
        const obj = parsed as Record<string, unknown>;
        fromDate = String(obj.fromDate ?? "").trim();
        toDate = String(obj.toDate ?? "").trim();
        const limit = Number(obj.topProductsLimit ?? 5);
        topProductsLimit = Number.isFinite(limit) ? limit : 5;
      }
    } catch {
      return Response.json({ message: "Invalid filter" }, { status: 400 });
    }
  } else {
    // Backward compatible query params
    fromDate = String(searchParams.get("fromDate") ?? "").trim();
    toDate = String(searchParams.get("toDate") ?? "").trim();
    const limit = Number(searchParams.get("topProductsLimit") ?? "5");
    topProductsLimit = Number.isFinite(limit) ? limit : 5;
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (!accessToken) {
    return Response.json({ message: "Unauthenticated" }, { status: 401 });
  }

  // Backend Spring binding for object query params often expects flat params
  // (e.g. `fromDate`, `toDate`, `topProductsLimit`) instead of JSON in `filter`.
  // Always send flat params to avoid null Integer issues on the backend.
  const safeLimit =
    Number.isFinite(topProductsLimit) && topProductsLimit > 0
      ? Math.floor(topProductsLimit)
      : 5;
  const qs = new URLSearchParams();
  if (fromDate) qs.set("fromDate", fromDate);
  if (toDate) qs.set("toDate", toDate);
  qs.set("topProductsLimit", String(safeLimit));

  const bases = getBaseCandidates();
  let lastStatus = 500;
  let lastPayload: unknown = null;

  for (const base of bases) {
    const backendRes = await fetch(
      `${base}/dashboard/shop/overview?${qs.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    ).catch(() => null);

    if (!backendRes) continue;

    const payload = await readJsonOrNull(backendRes);
    lastStatus = backendRes.status;
    lastPayload = payload;

    if (backendRes.ok) {
      return Response.json(payload, { status: backendRes.status || 200 });
    }

    if (backendRes.status === 404 || backendRes.status === 405) {
      continue;
    }

    return Response.json(
      payload ?? { message: `Load dashboard failed (${backendRes.status})` },
      { status: backendRes.status || 500 },
    );
  }

  const message =
    lastPayload &&
    typeof lastPayload === "object" &&
    "message" in lastPayload &&
    typeof (lastPayload as Record<string, unknown>).message === "string"
      ? String((lastPayload as Record<string, unknown>).message)
      : `Load dashboard failed (${lastStatus || 500})`;

  return Response.json(
    { message, payload: lastPayload },
    { status: lastStatus || 500 },
  );
}
