"use client";

import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { sendChatMessage, type ChatBotResponse } from "@/services/chatbot.service";
import { useAppContext } from "@/app/AppProvider";

interface Message {
    id: string;
    role: "user" | "bot";
    text: string;
    isLoading?: boolean;
}

const WELCOME_MSG: Message = {
    id: "welcome",
    role: "bot",
    text: "Xin chào! Tôi là NV Future&Better 🍵 Tôi có thể giúp bạn xem menu hoặc đặt món. Bạn cần gì ạ?",
};

export default function ChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
    const [input, setInput] = useState("");
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { accessToken } = useAppContext();

    // Auto scroll khi có tin nhắn mới
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input khi mở
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || isTyping) return;

        const userMsg: Message = {
            id: `user-${Date.now()}`,
            role: "user",
            text,
        };
        const loadingMsg: Message = {
            id: `loading-${Date.now()}`,
            role: "bot",
            text: "",
            isLoading: true,
        };

        setMessages((prev) => [...prev, userMsg, loadingMsg]);
        setInput("");
        setIsTyping(true);

        const res: ChatBotResponse = await sendChatMessage(
            text,
            accessToken || undefined,
            conversationId || undefined
        ).finally(() => setIsTyping(false));

        if (res.conversationId) setConversationId(res.conversationId);

        setMessages((prev) =>
            prev
                .filter((m) => !m.isLoading)
                .concat({
                    id: `bot-${Date.now()}`,
                    role: "bot",
                    text: res.reply || res.message || "Tôi không hiểu yêu cầu này, bạn có thể nói rõ hơn không?",
                }),
        );

        if (res.action === "ORDER" && (res.orderId || res.redirectToPayment)) {
            setTimeout(() => {
                setIsOpen(false);
                const orderIdParam = res.orderId ? `&orderId=${res.orderId}` : "";
                router.push(`/checkout?mode=chatbot${orderIdParam}`);
            }, 2000);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    /**
     * Render markdown-lite cho bot message:
     * - ## Tiêu đề danh mục → heading nổi bật
     * - **text** → in đậm màu nâu
     * - Dòng bắt đầu  • hoặc "- " → bullet (KHÔNG nhận * để tránh xung đột với bold)
     * - Dòng trống → khoảng cách
     */
    const renderBotText = (text: string) => {
        const lines = text.split("\n");

        const renderInline = (str: string): React.ReactNode[] => {
            const parts = str.split(/(\*\*[^*]+\*\*)/g);
            return parts.map((part, j) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                        <strong key={j} className="font-semibold text-[#693916]">
                            {part.slice(2, -2)}
                        </strong>
                    );
                }
                return <span key={j}>{part}</span>;
            });
        };

        return lines.map((line, i) => {
            const trimmed = line.trimStart();

            // ## Category heading
            if (trimmed.startsWith("## ")) {
                return (
                    <div key={i} className="mt-3 mb-1 pb-0.5 border-b border-amber-200 first:mt-0">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-amber-600">
                            {trimmed.slice(3)}
                        </span>
                    </div>
                );
            }

            // Bullet: chỉ nhận • hoặc "- " (2 ký tự), không nhận * để không xung đột với **bold**
            if (trimmed.startsWith("• ") || trimmed.startsWith("•") && trimmed.length > 1 || trimmed.startsWith("- ")) {
                const content = trimmed.replace(/^•\s*|^-\s+/, "");
                return (
                    <div key={i} className="flex gap-1.5 mt-0.5">
                        <span className="text-amber-500 flex-shrink-0 leading-5">•</span>
                        <span className="text-gray-600 leading-5">{renderInline(content)}</span>
                    </div>
                );
            }

            // Dòng trống
            if (trimmed === "") {
                return <div key={i} className="h-1.5" />;
            }

            // Dòng thường
            return (
                <div key={i} className="mt-1 first:mt-0 leading-5">
                    {renderInline(line)}
                </div>
            );
        });
    };

    return (
        <>
            {/* Floating Button */}
            <button
                id="chatbot-toggle-btn"
                onClick={() => setIsOpen((o) => !o)}
                aria-label={isOpen ? "Đóng chat" : "Mở chat với nhân viên AI"}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#693916] text-white shadow-xl flex items-center justify-center hover:bg-[#7a4420] transition-all duration-300 hover:scale-110 active:scale-95"
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            </button>

            {/*
              Chat Panel — kích thước CỐ ĐỊNH, dùng opacity + translateY để ẩn/hiện
              Không dùng scale vì scale làm panel trông nhỏ hơn lúc đang mở
            */}
            <div
                className={`fixed bottom-24 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-amber-100 flex flex-col overflow-hidden transition-all duration-300 ${
                    isOpen
                        ? "opacity-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 translate-y-4 pointer-events-none"
                }`}
                style={{ width: "min(420px, calc(100vw - 2rem))", height: "620px" }}
                aria-hidden={!isOpen}
            >
                {/* Header */}
                <div className="flex items-center gap-3 bg-[#693916] px-4 py-3 text-white flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold leading-tight">NV Future&Better</p>
                        <p className="text-[11px] text-amber-200">Trợ lý đặt hàng AI · Luôn sẵn sàng</p>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="ml-auto p-1 rounded-full hover:bg-white/20 transition"
                        aria-label="Đóng chat"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-amber-50/30">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            {msg.role === "bot" && (
                                <div className="w-7 h-7 rounded-full bg-[#693916] flex items-center justify-center flex-shrink-0 self-start mt-1">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                            )}

                            <div
                                className={`max-w-[82%] px-3 py-2.5 rounded-2xl text-sm ${
                                    msg.role === "user"
                                        ? "bg-[#693916] text-white rounded-br-sm whitespace-pre-wrap leading-relaxed"
                                        : "bg-white text-gray-800 border border-amber-100 rounded-bl-sm shadow-sm"
                                }`}
                            >
                                {msg.isLoading ? (
                                    <span className="flex items-center gap-1 text-gray-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0ms]" />
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:150ms]" />
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:300ms]" />
                                    </span>
                                ) : msg.role === "bot" ? (
                                    <div>{renderBotText(msg.text)}</div>
                                ) : (
                                    msg.text
                                )}
                            </div>

                            {msg.role === "user" && (
                                <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4 text-amber-800" />
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="border-t border-amber-100 bg-white px-3 py-2.5 flex items-center gap-2 flex-shrink-0">
                    <input
                        ref={inputRef}
                        id="chatbot-input"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Nhập tin nhắn..."
                        disabled={isTyping}
                        className="flex-1 text-sm bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-60"
                    />
                    <button
                        id="chatbot-send-btn"
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        aria-label="Gửi"
                        className="w-9 h-9 bg-[#693916] text-white rounded-xl flex items-center justify-center hover:bg-[#7a4420] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isTyping ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>
        </>
    );
}
