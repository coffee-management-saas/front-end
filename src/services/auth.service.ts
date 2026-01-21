// export async function slideSessionFromNextClientToNextServer(): Promise<{
//   data: { accessToken?: string; refreshToken?: string; expiresAt?: string };
// }> {
//   const res = await fetch("/api/auth/slide-session", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     credentials: "include",
//   });

//   const payload = await res.json().catch(() => null);

//   if (!res.ok) {
//     throw new Error(payload?.message || `Slide session failed (${res.status})`);
//   }

//   return payload; // kỳ vọng { data: { accessToken, refreshToken, expiresAt } }
// }
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
