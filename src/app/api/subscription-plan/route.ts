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
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  const bases = getBaseCandidates();
  // Backend in this project exposes plans under `/system/subscription-plan`.
  // Keep `/subscription-plan` as a fallback for other environments.
  const paths = ["/system/subscription-plan", "/subscription-plan"];
  const search = new URL(req.url).search;

  let lastStatus = 500;
  let lastPayload: unknown = null;

  for (const base of bases) {
    for (const path of paths) {
      const makeHeaders = (withAuth: boolean) => {
        const headers: Record<string, string> = { Accept: "application/json" };
        if (withAuth && accessToken) headers.Authorization = `Bearer ${accessToken}`;
        return headers;
      };

      const url = `${base}${path}${search}`;
      const attempts: Array<{ withAuth: boolean; res: Response | null }> = [];

      const primary = await fetch(url, {
        method: "GET",
        headers: makeHeaders(true),
        cache: "no-store",
      }).catch(() => null);
      attempts.push({ withAuth: true, res: primary });

      if (accessToken) {
        // Some public endpoints reject invalid/insufficient tokens with 400/401/403.
        // Try once more without Authorization so we can still load public plans.
        const status = primary?.status;
        if (status === 400 || status === 401 || status === 403) {
          const secondary = await fetch(url, {
            method: "GET",
            headers: makeHeaders(false),
            cache: "no-store",
          }).catch(() => null);
          attempts.push({ withAuth: false, res: secondary });
        }
      }

      for (const attempt of attempts) {
        if (!attempt.res) continue;

        const payload = await readJsonOrNull(attempt.res);
        lastStatus = attempt.res.status;
        lastPayload = payload;

        if (attempt.res.ok) {
          return Response.json(payload, { status: attempt.res.status || 200 });
        }

        // If the backend doesn't have this route at the current base, try the next candidate.
        if (
          attempt.res.status === 400 ||
          attempt.res.status === 404 ||
          attempt.res.status === 405 ||
          attempt.res.status === 401 ||
          attempt.res.status === 403
        ) {
          continue;
        }

        return Response.json(
          payload ?? { message: `Load failed (${attempt.res.status})` },
          { status: attempt.res.status || 500 },
        );
      }
    }
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
