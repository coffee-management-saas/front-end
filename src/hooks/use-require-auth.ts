"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppContext } from "@/app/AppProvider";

export type AuthRole = "SHOP" | "EMPLOYEE" | "SYSTEM" | "USER";

function getRoleFromAccessToken(token: string): AuthRole | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );

    const payload = JSON.parse(atob(padded)) as {
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
    const role = normalized.startsWith("ROLE_")
      ? normalized.slice(5)
      : normalized;

    if (
      role === "SHOP" ||
      role === "EMPLOYEE" ||
      role === "SYSTEM" ||
      role === "USER"
    ) {
      return role;
    }

    return null;
  } catch {
    return null;
  }
}

function buildLoginUrl(nextPath: string, redirectTo?: string) {
  const base = redirectTo?.trim() || "/login";
  const url = new URL(base, "http://localhost");
  url.searchParams.set("next", nextPath);
  return `${url.pathname}${url.search}`;
}

function buildForbiddenUrl(nextPath: string, forbiddenTo?: string) {
  const base = forbiddenTo?.trim() || "/forbidden";
  const url = new URL(base, "http://localhost");
  url.searchParams.set("next", nextPath);
  return `${url.pathname}${url.search}`;
}

export function useRequireAuth(options?: {
  roles?: AuthRole[];
  redirectTo?: string;
  forbiddenTo?: string;
  message?: string;
  showToast?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const { tokens } = useAppContext();
  const notifiedRef = useRef(false);

  const role = useMemo(
    () =>
      tokens.accessToken ? getRoleFromAccessToken(tokens.accessToken) : null,
    [tokens.accessToken],
  );

  useEffect(() => {
    if (!tokens.accessToken) {
      if (options?.showToast !== false && !notifiedRef.current) {
        notifiedRef.current = true;
        toast.error(options?.message ?? "Vui lòng đăng nhập để tiếp tục.");
      }
      router.replace(buildLoginUrl(pathname, options?.redirectTo));
      return;
    }

    if (options?.roles?.length) {
      const ok = role ? options.roles.includes(role) : false;
      if (!ok) {
        router.replace(buildForbiddenUrl(pathname, options?.forbiddenTo));
      }
    }
  }, [
    pathname,
    role,
    router,
    tokens.accessToken,
    options?.forbiddenTo,
    options?.message,
    options?.redirectTo,
    options?.roles,
    options?.showToast,
  ]);

  return { accessToken: tokens.accessToken, role };
}
