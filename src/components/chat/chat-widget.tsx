"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, ChevronDown } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WELCOME: Message = {
  role: "assistant",
  content:
    "Xin chào! Mình là trợ lý AI của CHYS Fashion 👋\n\nMình có thể giúp bạn:\n• Tư vấn sản phẩm & chọn size\n• Kiểm tra trạng thái đơn hàng\n• Giải đáp chính sách đổi trả, vận chuyển\n\nBạn cần mình hỗ trợ gì nào?",
};

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="block h-2 w-2 animate-bounce rounded-full bg-stone-400"
          style={{ animationDelay: `${delay}ms`, animationDuration: "900ms" }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "rounded-br-sm bg-[#a9843f] text-white"
            : "rounded-bl-sm bg-stone-100 text-stone-800"
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [messages, open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    const nextMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      const reply: Message = { role: "assistant", content: data.message };
      setMessages((prev) => [...prev, reply]);
      if (!open) setUnread((n) => n + 1);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Xin lỗi bạn, mình gặp lỗi kết nối. Vui lòng thử lại nhé!" },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, open]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Mở chat hỗ trợ"
        style={{
          bottom: "calc(1.25rem + env(safe-area-inset-bottom))",
          right: "calc(1.25rem + env(safe-area-inset-right))",
        }}
        className={`fixed z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#a9843f] text-white shadow-lg transition-all duration-200 hover:bg-[#8a6b31] active:scale-95 ${open ? "pointer-events-none opacity-0 scale-90" : "opacity-100 scale-100"}`}
      >
        <MessageCircle size={24} strokeWidth={1.75} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {/* ── Backdrop (mobile only) ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Chat panel ── */}
      <div
        className={`fixed z-50 flex flex-col bg-white shadow-2xl transition-all duration-300 ease-out
          ${open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"}
          bottom-0 left-0 right-0 h-[88svh] rounded-t-2xl
          lg:bottom-24 lg:left-auto lg:right-5 lg:h-[540px] lg:w-[380px] lg:rounded-2xl`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 rounded-t-2xl border-b border-stone-100 bg-white px-4 py-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#a9843f] text-sm font-semibold text-white">
            C
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-stone-800">CHYS Assistant</p>
            <div className="flex items-center gap-1.5">
              <span className="block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <p className="text-xs text-stone-500">Trực tuyến</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-full p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
            aria-label="Đóng chat"
          >
            <ChevronDown size={20} />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="rounded-full p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 lg:hidden"
            aria-label="Đóng chat"
          >
            <X size={20} />
          </button>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-stone-100 px-4 py-3">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Quick replies (shown only on first message) */}
        {messages.length === 1 && !loading && (
          <div className="shrink-0 px-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {["Kiểm tra đơn hàng", "Tư vấn size", "Chính sách đổi trả"].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q);
                    setTimeout(() => inputRef.current?.focus(), 0);
                  }}
                  className="rounded-full border border-[#a9843f]/40 px-3 py-1.5 text-xs text-[#8a6b31] transition-colors hover:bg-[#a9843f]/10"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div
          className="shrink-0 border-t border-stone-100 bg-white px-3 py-3"
          style={{
            paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
            paddingLeft: "calc(0.75rem + env(safe-area-inset-left))",
            paddingRight: "calc(0.75rem + env(safe-area-inset-right))",
          }}
        >
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Nhắn tin với CHYS..."
              disabled={loading}
              style={{ fontSize: "16px" }}
              className="min-w-0 flex-1 rounded-full border border-stone-200 bg-stone-50 px-4 py-2.5 text-stone-800 placeholder:text-stone-400 outline-none transition-colors focus:border-[#a9843f] focus:bg-white disabled:opacity-60"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              aria-label="Gửi tin nhắn"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#a9843f] text-white transition-all hover:bg-[#8a6b31] disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
            >
              <Send size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
