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
  let yearRaw = String(searchParams.get("year") ?? "").trim();
  let productNumRaw = String(searchParams.get("productNum") ?? "").trim();

  if (filterRaw) {
    try {
      const parsed = JSON.parse(filterRaw) as unknown;
      if (parsed && typeof parsed === "object") {
        const obj = parsed as Record<string, unknown>;
        yearRaw = String(obj.year ?? "").trim();
        productNumRaw = String(obj.productNum ?? "").trim();
      }
    } catch {
      return Response.json({ message: "Invalid filter" }, { status: 400 });
    }
  }

  const year = Number(yearRaw);
  const productNum = Number(productNumRaw || "5");

  if (!yearRaw || !Number.isInteger(year) || year < 1970 || year > 9999) {
    return Response.json({ message: "Invalid year" }, { status: 400 });
  }
  if (!Number.isFinite(productNum) || productNum <= 0) {
    return Response.json({ message: "Invalid productNum" }, { status: 400 });
  }

  const safeProductNum = Math.min(50, Math.floor(productNum));

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (!accessToken) {
    return Response.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const qs = new URLSearchParams({
    year: String(year),
    productNum: String(safeProductNum),
  });

  const bases = getBaseCandidates();
  let lastStatus = 500;
  let lastPayload: unknown = null;

  for (const base of bases) {
    const backendRes = await fetch(
      `${base}/dashboard/shop/overview/top-products?${qs.toString()}`,
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
      payload ?? { message: `Load top-products failed (${backendRes.status})` },
      { status: backendRes.status || 500 },
    );
  }

  const message =
    lastPayload &&
    typeof lastPayload === "object" &&
    "message" in lastPayload &&
    typeof (lastPayload as Record<string, unknown>).message === "string"
      ? String((lastPayload as Record<string, unknown>).message)
      : `Load top-products failed (${lastStatus || 500})`;

  return Response.json(
    { message, payload: lastPayload },
    { status: lastStatus || 500 },
  );
}

