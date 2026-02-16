import envConfig from "@/config";
import { ApiError } from "@/lib/utils";
import type {
  InvoiceCreateInput,
  InvoiceDto,
  InvoiceResponse,
  InvoicesResponse,
} from "@/types/invoice";

async function parseJsonSafely<T>(res: Response): Promise<T | null> {
  const raw = await res.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new ApiError("BE trả về không phải JSON", 502, raw);
  }
}

export async function getInvoices(
  params: {
    page: number;
    size: number;
  },
  accessToken?: string,
): Promise<InvoicesResponse> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");

  const qs = new URLSearchParams({
    page: String(params.page),
    size: String(params.size),
  });

  const beUrl = `${base}/inventory/invoices?${qs.toString()}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    cache: "no-store",
  });

  const data = await parseJsonSafely<InvoicesResponse>(res);

  if (!res.ok) {
    throw new ApiError("BE error", res.status, data);
  }

  if (!data || Number(data.code) !== 200) {
    throw new ApiError(data?.message || "Get invoices failed", 400, data);
  }

  return data;
}

export async function getInvoiceById(
  id: number | string,
  accessToken?: string,
): Promise<InvoiceDto> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/inventory/invoices/${id}`;

  const res = await fetch(beUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    cache: "no-store",
  });

  const data = await parseJsonSafely<InvoiceResponse>(res);

  if (!res.ok || !data || data.code < 200 || data.code >= 300) {
    throw new ApiError(data?.message || "Get invoice failed", res.status, data);
  }

  return data.data;
}

export async function createInvoice(
  payload: InvoiceCreateInput,
  accessToken?: string,
): Promise<InvoiceDto> {
  const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
  const beUrl = `${base}/inventory/invoices`;

  const res = await fetch(beUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await parseJsonSafely<InvoiceResponse>(res);

  if (!res.ok || !data || data.code < 200 || data.code >= 300) {
    throw new ApiError(
      data?.message || "Create invoice failed",
      res.status,
      data,
    );
  }

  return data.data;
}
