import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export class ApiError<T = unknown> extends Error {
  status: number;
  payload?: T;

  constructor(message: string, status: number, payload?: T) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export function getJwtExpiresAt(accessToken: string): string {
  try {
    const parts = accessToken.split(".");
    if (parts.length < 2) return "";

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );

    const payload = JSON.parse(atob(padded));
    if (!payload?.exp) return "";

    return new Date(payload.exp * 1000).toISOString();
  } catch {
    return "";
  }
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

export const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=1200&q=80";

export const canUseImage = (url: string | undefined | null) => {
  if (!url) return false;
  return /^https?:\/\//.test(url) || url.startsWith("/");
};

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}
