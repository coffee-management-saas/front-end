export async function refreshFromNextClientToNextServer(): Promise<{
  data: { accessToken: string; expiresAt: string };
}> {
  const res = await fetch("/api/auth/refresh", {
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
  const res = await fetch("/api/auth/logout", { method: "POST" });
  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(payload?.message || `Logout failed (${res.status})`);
  }
  return payload;
}
