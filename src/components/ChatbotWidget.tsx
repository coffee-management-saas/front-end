"use client";

import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  sendChatMessage,
  type ChatBotResponse,
} from "@/services/chatbot.service";
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

    // sendChatMessage không throw nữa — luôn trả ChatBotResponse hợp lệ
    const res: ChatBotResponse = await sendChatMessage(
      text,
      accessToken || undefined,
    ).finally(() => setIsTyping(false));

    // Xóa loading message, thêm response
    setMessages((prev) =>
      prev
        .filter((m) => !m.isLoading)
        .concat({
          id: `bot-${Date.now()}`,
          role: "bot",
          text:
            res.message ||
            "Tôi không hiểu yêu cầu này, bạn có thể nói rõ hơn không?",
        }),
    );

    // Khi AI đã thu thập đủ thông tin → redirect sang trang thanh toán
    if (res.action === "ORDER" && res.redirectToPayment && res.orderRequest) {
      // Lưu orderRequest vào sessionStorage để trang checkout đọc
      sessionStorage.setItem(
        "chatbot_order_request",
        JSON.stringify(res.orderRequest),
      );
      setTimeout(() => {
        setIsOpen(false);
        router.push("/checkout?mode=chatbot");
      }, 1500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        id="chatbot-toggle-btn"
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? "Đóng chat" : "Mở chat với nhân viên AI"}
        className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full bg-[#693916] text-white shadow-xl flex items-center justify-center hover:bg-[#7a4420] transition-all duration-300 hover:scale-110 active:scale-95"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-44 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-amber-100 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${
          isOpen
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-90 pointer-events-none"
        }`}
        style={{ maxHeight: "520px" }}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center gap-3 bg-[#693916] px-4 py-3 text-white">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">NV Future&Better</p>
            <p className="text-[11px] text-amber-200">
              Trợ lý đặt hàng AI · Luôn sẵn sàng
            </p>
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
                <div className="w-7 h-7 rounded-full bg-[#693916] flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div
                className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-[#693916] text-white rounded-br-sm"
                    : "bg-white text-gray-800 border border-amber-100 rounded-bl-sm shadow-sm"
                }`}
              >
                {msg.isLoading ? (
                  <span className="flex items-center gap-1 text-gray-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:300ms]" />
                  </span>
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
        <div className="border-t border-amber-100 bg-white px-3 py-2.5 flex items-center gap-2">
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
