"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, SendHorizonal } from "lucide-react";
import { STORAGE_KEYS, readStoredJson } from "@/lib/storage";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  focusTrigger?: number;
};

function readPortfolioContext(): Record<string, unknown> | null {
  return (
    readStoredJson<Record<string, unknown>>(STORAGE_KEYS.xrayResult) ??
    readStoredJson<Record<string, unknown>>(STORAGE_KEYS.legacyXrayResult)
  );
}

export default function ChatDrawer({ isOpen, onClose, focusTrigger = 0 }: ChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasPortfolioContext, setHasPortfolioContext] = useState(false);
  const [portfolioContext, setPortfolioContext] = useState<Record<string, unknown> | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const context = readPortfolioContext();
    setPortfolioContext(context);
    setHasPortfolioContext(Boolean(context));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    window.setTimeout(() => textareaRef.current?.focus(), 120);
  }, [isOpen, focusTrigger]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const updateHeight = () => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.style.height = "0px";
      const maxHeight = 104;
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    };
    updateHeight();
  }, [input]);

  const canSubmit = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);

  const submitMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          portfolioContext,
        }),
      });

      const payload = (await res.json().catch(() => null)) as { answer?: string; error?: string } | null;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.ok ? payload?.answer || "I could not generate a response. Please retry." : payload?.error || "I could not generate a response. Please retry.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I hit a temporary issue fetching live context. Please retry in a few seconds.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitMessage();
    }
  };

  const suggestionChips = [
    "How is Nifty performing today?",
    "Should I increase my SIP?",
    "What is XIRR?",
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-black/95 backdrop-blur-xl border-l border-white/10 flex flex-col"
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="font-heading italic text-white text-lg">AI Assistant</h2>
                {hasPortfolioContext && (
                  <span className="text-emerald-400 text-xs font-semibold uppercase tracking-widest">Portfolio-aware</span>
                )}
              </div>
              <button onClick={onClose} className="liquid-glass rounded-lg p-2 text-white/60 hover:text-white transition-colors" aria-label="Close assistant">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-5 px-4">
                  <p className="text-white/20 text-sm leading-relaxed">Ask anything about markets, your portfolio, or a stock.</p>
                  <div className="flex flex-col gap-2 w-full">
                    {suggestionChips.map((chip) => (
                      <button key={chip} onClick={() => void submitMessage(chip)} className="liquid-glass rounded-full px-3 py-2 text-xs text-white/50 cursor-pointer hover:text-white transition-colors text-left">
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm font-body leading-relaxed whitespace-pre-wrap ${message.role === "user" ? "bg-white/10 rounded-br-sm text-white" : "liquid-glass rounded-bl-sm text-white/90"}`}>
                        {message.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="liquid-glass rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[85%]">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.2s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.1s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="px-4 py-4 border-t border-white/10">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Ask anything..."
                  className="flex-1 bg-white/5 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/30 outline-none resize-none border border-white/10 focus:border-white/20 transition"
                />
                <button onClick={() => void submitMessage()} disabled={!canSubmit} className="liquid-glass-strong rounded-xl p-2.5 text-white disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Send message">
                  <SendHorizonal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

