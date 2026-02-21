"use client";

import { useEffect, useRef } from "react";
import { useAppContext } from "@/app/AppProvider";
import { refreshFromNextClientToNextServer } from "@/services/auth.service";

// Check mỗi 30s là đủ nhẹ mà vẫn kịp phản ứng
const CHECK_EVERY_MS = 30 * 1000;

// Refresh khi còn dưới 60s (an toàn cho mọi TTL)
const REFRESH_THRESHOLD_MS = 60 * 1000;

// Sau khi refresh thành công, tối thiểu 30s mới refresh tiếp (tránh spam)
const COOLDOWN_MS = 30 * 1000;

export default function SlideSession() {
  const { tokens, setTokens } = useAppContext();

  const tokensRef = useRef(tokens);
  const lockRef = useRef(false);
  const lastSuccessRefreshAtRef = useRef(0);

  // luôn giữ tokens mới nhất
  useEffect(() => {
    tokensRef.current = tokens;
  }, [tokens]);

  const tickRef = useRef<() => Promise<void>>(async () => {});
  tickRef.current = async () => {
    const expiresAtStr = tokensRef.current.expiresAt;
    if (!expiresAtStr) return;

    const expMs = new Date(expiresAtStr).getTime();
    if (Number.isNaN(expMs)) return;

    const nowMs = Date.now();
    const remainingMs = expMs - nowMs;

    // còn nhiều thời gian thì thôi
    if (remainingMs > REFRESH_THRESHOLD_MS) return;

    // cooldown chỉ tính sau lần refresh THÀNH CÔNG
    if (nowMs - lastSuccessRefreshAtRef.current < COOLDOWN_MS) return;

    // tránh refresh song song
    if (lockRef.current) return;

    lockRef.current = true;
    try {
      const res = await refreshFromNextClientToNextServer();
      if (!res?.data?.accessToken) return;

      setTokens((prev) => ({
        ...prev,
        accessToken: res.data.accessToken,
        expiresAt: res.data.expiresAt,
      }));

      lastSuccessRefreshAtRef.current = Date.now();
    } catch (e) {
      console.error("SlideSession refresh error:", e);
    } finally {
      lockRef.current = false;
    }
  };

  useEffect(() => {
    // chạy ngay khi mount
    tickRef.current();

    // check định kỳ
    const interval = setInterval(() => {
      tickRef.current();
    }, CHECK_EVERY_MS);

    // khi quay lại tab (tránh throttle), check ngay
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        tickRef.current();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
