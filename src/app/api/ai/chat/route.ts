import { cookies } from "next/headers";
import envConfig from "@/config";

// Timeout 30 giây — Gemini 2.5 Flash thường phản hồi trong 1-5s
const AI_TIMEOUT_MS = 30_000;

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get("accessToken")?.value;

        const body = await req.json().catch(() => null);
        if (!body?.message) {
            return Response.json(
                { action: "INFO", message: "Thiếu nội dung tin nhắn" },
                { status: 400 },
            );
        }

        const base = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, "");
        const beUrl = `${base}/ai/chat`;

        // AbortController để tránh treo mãi
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

        let beRes: Response;
        try {
            beRes = await fetch(beUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({ message: body.message }),
                cache: "no-store",
                signal: controller.signal,
            });
        } catch (err: unknown) {
            clearTimeout(timeoutId);
            const isTimeout = err instanceof Error && err.name === "AbortError";
            console.error("[AI Chat Proxy] Fetch error:", err);
            return Response.json(
                {
                    action: "INFO",
                    message: isTimeout
                        ? "AI đang xử lý quá lâu, vui lòng thử lại. (Timeout sau 30s)"
                        : "Không kết nối được tới backend AI.",
                },
                { status: 503 },
            );
        }
        clearTimeout(timeoutId);

        const text = await beRes.text();
        let data: unknown;
        try {
            data = JSON.parse(text);
        } catch {
            // Backend trả plain text → wrap thành INFO
            data = { action: "INFO", message: text, orderId: null };
        }

        // Truyền status nguyên từ backend
        return Response.json(data, { status: beRes.ok ? 200 : beRes.status });
    } catch (err) {
        console.error("[AI Chat Proxy] Unexpected error:", err);
        return Response.json(
            {
                action: "INFO",
                message: "Lỗi không xác định ở proxy. Vui lòng thử lại.",
            },
            { status: 500 },
        );
    }
}
