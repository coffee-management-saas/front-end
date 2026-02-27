import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const privatePaths = ["/profile"];
const authPaths = ["/login", "/register"];
const adminPaths = ["/admin"];
const staffPaths = ["/staff"];

function getRoleFromAccessToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );

    if (typeof globalThis.atob !== "function") return null;
    const payload = JSON.parse(globalThis.atob(padded)) as {
      role?: unknown;
      roles?: unknown;
      authorities?: unknown;
    };

    const rawRole =
      payload?.role ??
      (Array.isArray(payload?.roles) ? payload.roles[0] : null) ??
      (Array.isArray(payload?.authorities) ? payload.authorities[0] : null);

    if (!rawRole) return null;

    const normalized = String(rawRole).toUpperCase();
    return normalized.startsWith("ROLE_") ? normalized.slice(5) : normalized;
  } catch {
    return null;
  }
}

function isMatchPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;

  if (adminPaths.some((path) => isMatchPrefix(pathname, path))) {
    if (!accessToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const role = getRoleFromAccessToken(accessToken);
    if (role !== "SHOP") {
      const url = new URL("/forbidden", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (staffPaths.some((path) => isMatchPrefix(pathname, path))) {
    if (!accessToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const role = getRoleFromAccessToken(accessToken);
    if (role !== "EMPLOYEE") {
      const url = new URL("/forbidden", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (privatePaths.some((path) => pathname.startsWith(path)) && !accessToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const forceAuth = searchParams.get("force") === "1";

  if (
    authPaths.some((path) => pathname.startsWith(path)) &&
    accessToken &&
    !forceAuth
  ) {
    const role = getRoleFromAccessToken(accessToken);
    if (role === "SHOP") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (role === "SYSTEM") {
      return NextResponse.redirect(new URL("/system", request.url));
    }
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/login",
    "/register",
    "/admin/:path*",
    "/staff/:path*",
  ],
};
