import envConfig from "@/config";
import { cookies } from "next/headers";

function getBaseCandidates(): string[] {
  const raw = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const candidates = [raw];

  // Some backends expose endpoints under `/api/*`, while others are at root.
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
  const page = Number(searchParams.get("page") ?? "0");
  const size = Number(searchParams.get("size") ?? "20");

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (!accessToken) {
    return Response.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const qs = new URLSearchParams({
    page: String(Number.isFinite(page) ? page : 0),
    size: String(Number.isFinite(size) ? size : 20),
  });

  const bases = getBaseCandidates();
  let lastStatus = 500;
  let lastPayload: unknown = null;

  for (const base of bases) {
    const backendRes = await fetch(`${base}/shops?${qs.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }).catch(() => null);

    if (!backendRes) continue;

    const payload = await readJsonOrNull(backendRes);
    lastStatus = backendRes.status;
    lastPayload = payload;

    if (backendRes.ok) {
      return Response.json(payload, { status: backendRes.status || 200 });
    }

    // If the backend doesn't have this route at the current base, try the next candidate.
    if (backendRes.status === 404 || backendRes.status === 405) {
      continue;
    }

    return Response.json(
      payload ?? { message: `Load failed (${backendRes.status})` },
      { status: backendRes.status || 500 },
    );
  }

  const message =
    lastPayload &&
    typeof lastPayload === "object" &&
    "message" in lastPayload &&
    typeof (lastPayload as Record<string, unknown>).message === "string"
      ? String((lastPayload as Record<string, unknown>).message)
      : `Load failed (${lastStatus || 500})`;

  return Response.json(
    { message, payload: lastPayload },
    { status: lastStatus || 500 },
  );
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (!accessToken) {
    return Response.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ message: "Invalid request body" }, { status: 400 });
  }

  const obj = body as Record<string, unknown>;
  const shopName = String(obj.shopName ?? "").trim();
  const address = String(obj.address ?? "").trim();
  const phone = String(obj.phone ?? "").trim();
  const email = String(obj.email ?? "").trim();
  const domain = String(obj.domain ?? "").trim();
  const status = String(obj.status ?? "").trim();

  if (!shopName || !address || !phone || !email || !domain || !status) {
    return Response.json(
      { message: "Missing required fields" },
      { status: 400 },
    );
  }

  const bases = getBaseCandidates();
  let lastStatus = 500;
  let lastPayload: unknown = null;

  for (const base of bases) {
    const backendRes = await fetch(`${base}/shops`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        shopName,
        address,
        phone,
        email,
        domain,
        status,
      }),
      cache: "no-store",
    }).catch(() => null);

    if (!backendRes) continue;

    const payload = await readJsonOrNull(backendRes);
    lastStatus = backendRes.status;
    lastPayload = payload;

    if (backendRes.ok) {
      return Response.json(payload, { status: backendRes.status || 200 });
    }

    // If the backend doesn't have this route at the current base, try the next candidate.
    if (backendRes.status === 404 || backendRes.status === 405) {
      continue;
    }

    return Response.json(
      payload ?? { message: `Create failed (${backendRes.status})` },
      { status: backendRes.status || 500 },
    );
  }

  const message =
    lastPayload &&
    typeof lastPayload === "object" &&
    "message" in lastPayload &&
    typeof (lastPayload as Record<string, unknown>).message === "string"
      ? String((lastPayload as Record<string, unknown>).message)
      : `Create failed (${lastStatus || 500})`;

  return Response.json(
    { message, payload: lastPayload },
    { status: lastStatus || 500 },
  );
}
