import { cookies } from "next/headers";
import envConfig from "@/config";

// decode exp từ accessToken (server-side)
function getExpiresAtFromJwt(accessToken: string): string {
    try {
        const parts = accessToken.split(".");
        if (parts.length < 2) return "";
        const payload = JSON.parse(
            Buffer.from(parts[1], "base64url").toString("utf8"),
        );
        if (!payload?.exp) return "";
        return new Date(payload.exp * 1000).toISOString();
    } catch {
        return "";
    }
}

function getAuthBaseCandidates(): string[] {
    const raw = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
    const candidates = [raw];

    // Some backends expose auth endpoints under `/api/*`, while others are at root.
    if (raw.endsWith("/api")) {
        candidates.push(raw.slice(0, -4));
    } else {
        candidates.push(`${raw}/api`);
    }

    return Array.from(new Set(candidates)).filter(Boolean);
}

function readRefreshTokens(data: unknown): {
    accessToken?: string;
    refreshToken?: string;
    message?: string;
} {
    if (!data || typeof data !== "object") return {};
    const obj = data as Record<string, unknown>;
    return {
        accessToken:
            typeof obj.accessToken === "string" ? obj.accessToken : undefined,
        refreshToken:
            typeof obj.refreshToken === "string" ? obj.refreshToken : undefined,
        message: typeof obj.message === "string" ? obj.message : undefined,
    };
}

export async function POST() {
    const cookieStore = await cookies();

    const refreshToken = cookieStore.get("refreshToken")?.value;
    if (!refreshToken) {
        return Response.json({ message: "Thiếu refreshToken" }, { status: 401 });
    }

    const bases = getAuthBaseCandidates();
    let lastStatus = 500;
    let lastData: unknown = null;

    for (const base of bases) {
        const backendRes = await fetch(`${base}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
            cache: "no-store",
        });

        const backendData = await backendRes.json().catch(() => null);
        lastStatus = backendRes.status;
        lastData = backendData;

        if (!backendRes.ok) continue;

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            readRefreshTokens(backendData);

        if (!newAccessToken) {
            return Response.json(
                { message: "Backend không trả accessToken" },
                { status: 500 },
            );
        }

        cookieStore.set("accessToken", newAccessToken, {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: false,
        });

        if (newRefreshToken) {
            cookieStore.set("refreshToken", newRefreshToken, {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: false,
            });
        }

        const expiresAt = getExpiresAtFromJwt(newAccessToken);

        return Response.json(
            {
                data: {
                    accessToken: newAccessToken,
                    expiresAt,
                },
            },
            { status: 200 },
        );
    }

    // If refresh token is invalid/expired, clear cookies to stop retry loops.
    if (lastStatus === 400 || lastStatus === 401 || lastStatus === 403) {
        cookieStore.delete("accessToken");
        cookieStore.delete("refreshToken");
    }

    const message =
        readRefreshTokens(lastData).message || `Refresh failed (${lastStatus})`;

    return Response.json({ message }, { status: lastStatus || 500 });
}
