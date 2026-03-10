export async function refreshFromNextClientToNextServer(): Promise<{
  data: { accessToken: string; expiresAt: string };
}> {
  const res = await fetch("/api-session/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(payload?.message || `Refresh failed (${res.status})`);
  }

  return payload;
}
export async function logoutFromNextClientToNextServer() {
  const res = await fetch("/api-session/logout", { method: "POST" });
  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    // Logout is best-effort: if the session is already invalid/expired, we still consider it "logged out"
    // because local cookies/tokens should be cleared anyway.
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      return payload;
    }
    throw new Error(payload?.message || `Logout failed (${res.status})`);
  }
  return payload;
}
