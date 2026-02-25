import envConfig from "@/config";

function getSystemAuthBaseCandidates(): string[] {
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

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const obj =
    body && typeof body === "object" ? (body as Record<string, unknown>) : null;

  const username = typeof obj?.username === "string" ? obj.username.trim() : "";
  const password = typeof obj?.password === "string" ? obj.password : "";
  const fullname = typeof obj?.fullname === "string" ? obj.fullname.trim() : "";
  const email = typeof obj?.email === "string" ? obj.email.trim() : "";
  const phone = typeof obj?.phone === "string" ? obj.phone.trim() : "";
  const address = typeof obj?.address === "string" ? obj.address.trim() : "";
  const dob = typeof obj?.dob === "string" ? obj.dob.trim() : "";

  if (
    !username ||
    !password ||
    !fullname ||
    !email ||
    !phone ||
    !address ||
    !dob
  ) {
    return Response.json(
      { message: "Missing required fields" },
      { status: 400 },
    );
  }

  const bases = getSystemAuthBaseCandidates();
  let lastStatus = 500;
  let lastPayload: unknown = null;

  for (const base of bases) {
    const backendRes = await fetch(`${base}/system/auth/register`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
        fullname,
        email,
        phone,
        address,
        dob,
      }),
      cache: "no-store",
    }).catch(() => null);

    if (!backendRes) continue;

    const payload = await readJsonOrNull(backendRes);
    lastStatus = backendRes.status;
    lastPayload = payload;

    if (backendRes.ok) {
      return Response.json(payload ?? { message: "OK" }, {
        status: backendRes.status || 200,
      });
    }

    // If the backend doesn't have this route at the current base, try the next candidate.
    if (backendRes.status === 404 || backendRes.status === 405) {
      continue;
    }

    return Response.json(
      payload ?? { message: `Register failed (${backendRes.status})` },
      { status: backendRes.status || 500 },
    );
  }

  const message =
    lastPayload &&
    typeof lastPayload === "object" &&
    "message" in lastPayload &&
    typeof (lastPayload as Record<string, unknown>).message === "string"
      ? String((lastPayload as Record<string, unknown>).message)
      : `Register failed (${lastStatus || 500})`;

  return Response.json(
    { message, payload: lastPayload },
    { status: lastStatus || 500 },
  );
}
