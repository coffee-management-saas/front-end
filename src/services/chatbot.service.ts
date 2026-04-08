import type { CreateOrderRequest } from "@/types/order";

export interface ChatBotResponse {
    action: "INFO" | "COLLECTING" | "ORDER";
    reply: string;
    message?: string; // alias for reply, mapped by proxy
    orderRequest?: CreateOrderRequest;
    redirectToPayment?: boolean;
    orderId?: number;
    conversationId?: string;
}

export async function sendChatMessage(
    message: string,
    accessToken?: string,
    conversationId?: string,
): Promise<ChatBotResponse> {
    let res: Response;
    try {
        res = await fetch("/api/ai/prompt", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify({ message, conversationId }),
            cache: "no-store",
        });
    } catch (networkErr) {
        // Lỗi mạng / backend không chạy
        console.error("[Chatbot] Network error:", networkErr);
        return {
            action: "INFO",
            reply: "Không kết nối được tới máy chủ. Vui lòng kiểm tra kết nối mạng.",
        };
    }

    // Đọc body dù status là gì
    let data: ChatBotResponse | null = null;
    try {
        const raw = await res.json();
        if (typeof raw === "string") {
            data = { action: "INFO", reply: raw };
        } else {
            data = raw as ChatBotResponse;
        }
    } catch {
        // Body không phải JSON (timeout HTML page, etc.)
        const text = await res.text().catch(() => "");
        console.error("[Chatbot] Non-JSON response:", text.substring(0, 200));
        return {
            action: "INFO",
            reply: "AI đang bận, vui lòng thử lại sau vài giây.",
        };
    }

    // Nếu server trả lỗi có message → hiển thị thay vì crash
    if (!res.ok) {
        console.error(`[Chatbot] Server error ${res.status}:`, data);
        return {
            action: "INFO",
            reply:
                (data as any)?.reply ||
                (data as any)?.message ||
                `Lỗi máy chủ (${res.status}). Vui lòng thử lại sau.`,
        };
    }

    // Đảm bảo reply không rỗng (backend trả field 'reply')
    if (!data?.reply && !data?.message) {
        return { action: "INFO", reply: "AI không trả lời được. Vui lòng thử lại." };
    }

    return data;
}
