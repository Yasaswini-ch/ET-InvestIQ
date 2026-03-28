"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, Bot, Sparkles, Trash2, Info, Link2, X } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { ChatSource, PortfolioChatContext } from "@/lib/types/chat";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
}

const PORTFOLIO_CONTEXT_KEY = "et_portfolio_context";

export default function ChatPage() {
  const modelLabel = process.env.NEXT_PUBLIC_CHAT_MODEL_LABEL || "AI Model";
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm ET InvestIQ AI. I can help with NSE/BSE stocks, market structure, and portfolio-driven strategy discussions.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [portfolioContext, setPortfolioContext] = useState<PortfolioChatContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PORTFOLIO_CONTEXT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setPortfolioContext(parsed);
    } catch {
      // Ignore invalid local storage
    }
  }, []);

  const handleSend = async (text?: string) => {
    const userMessage = (text ?? input).trim();
    if (!userMessage || isLoading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setInput("");
    setSuggestedQuestions([]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          portfolioContext,
        }),
      });

      const payload = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: payload.answer || "I could not generate a response. Please retry.",
          sources: Array.isArray(payload.sources) ? payload.sources : [],
        },
      ]);
      if (Array.isArray(payload.suggested)) setSuggestedQuestions(payload.suggested.slice(0, 2));
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: "assistant", content: "Chat cleared. How else can I help you today?" }]);
    setSuggestedQuestions([]);
  };

  const clearPortfolioContext = () => {
    localStorage.removeItem(PORTFOLIO_CONTEXT_KEY);
    setPortfolioContext(null);
  };

  const showQuickActions = messages.length <= 1 && suggestedQuestions.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-5xl mx-auto">
      <PageHeader
        title="Market Intelligence"
        description="Ask our AI about stocks, market structure, portfolio strategy, or macro context."
        action={
          <div className="flex items-center gap-2">
            {portfolioContext && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-400/20 rounded-lg text-[11px] font-bold text-emerald-400">
                Portfolio context active
                <button onClick={clearPortfolioContext} className="text-emerald-400 hover:text-emerald-300">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <button
              onClick={clearChat}
              className="liquid-glass p-2.5 rounded-lg text-white/60 hover:text-red-400 transition-all"
              title="Clear Conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        }
      />

      <div className="flex-grow flex flex-col liquid-glass rounded-2xl overflow-hidden">
        <div className="px-5 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">AI Agent Online</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            {modelLabel}
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center border ${
                  msg.role === "user"
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "bg-emerald-500/10 border-emerald-400/20 text-emerald-400"
                }`}>
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`flex flex-col max-w-[78%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-white/10 text-white rounded-tr-none"
                      : "bg-white/5 border border-white/10 text-white/80 rounded-tl-none"
                  }`}>
                    {msg.content || (
                      <div className="flex gap-1 py-0.5">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                      </div>
                    )}
                  </div>
                  {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 space-y-1 max-w-full">
                      {msg.sources.slice(0, 3).map((source, sourceIndex) => (
                        <a
                          key={sourceIndex}
                          href={source.url || "#"}
                          target={source.url ? "_blank" : undefined}
                          rel={source.url ? "noreferrer" : undefined}
                          className="inline-flex items-center gap-1.5 mr-2 px-2 py-1 liquid-glass rounded-md text-[10px] font-semibold text-white/60 hover:text-emerald-400 truncate max-w-[420px]"
                        >
                          <Link2 className="w-3 h-3" />
                          {source.title}
                        </a>
                      ))}
                    </div>
                  )}
                  <span className="text-[10px] text-white/40 mt-1 font-semibold uppercase tracking-wider px-1">
                    {msg.role === "user" ? "You" : "ET InvestIQ AI"}
                  </span>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                key="assistant-typing"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 flex-row"
              >
                <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center border bg-emerald-500/10 border-emerald-400/20 text-emerald-400">
                  <Bot className="w-4 h-4" />
                </div>

                <div className="flex flex-col max-w-[78%] items-start">
                  <div className="p-4 rounded-xl text-sm leading-relaxed bg-white/5 border border-white/10 text-white/80 rounded-tl-none">
                    <div className="flex gap-1 py-0.5">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                    </div>
                  </div>
                  <span className="text-[10px] text-white/40 mt-1 font-semibold uppercase tracking-wider px-1">
                    ET InvestIQ AI
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white/5 border-t border-white/10">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-xl py-3.5 pl-5 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-white/20 transition-all"
              placeholder="Ask about Nifty 50, HDFC Bank, sector trends, or portfolio risk..."
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg disabled:bg-white/10 disabled:text-white/30 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {suggestedQuestions.length > 0 ? (
              <motion.div
                key="suggested"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-3 flex flex-wrap gap-2"
              >
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider self-center mr-1">Follow up:</span>
                {suggestedQuestions.map((q, i) => (
                  <QuickAction key={i} label={q} onClick={() => handleSend(q)} />
                ))}
              </motion.div>
            ) : showQuickActions ? (
              <motion.div
                key="quick"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-3 flex flex-wrap gap-2"
              >
                <QuickAction label="Best Large Cap Funds?" onClick={() => handleSend("What are strong large cap funds to study now?")} />
                <QuickAction label="HDFC Bank Outlook?" onClick={() => handleSend("What is the current outlook for HDFC Bank?")} />
                <QuickAction label="Nifty Breakout?" onClick={() => handleSend("Is Nifty showing breakout or mean reversion signs?")} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-white/40 font-semibold uppercase tracking-wider">
        <Info className="w-3 h-3 text-emerald-400" />
        AI output blends model inference with live market context and cited sources.
      </div>
    </div>
  );
}

function QuickAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 liquid-glass rounded-lg text-[10px] font-semibold text-white/60 hover:text-white transition-all"
    >
      {label}
    </button>
  );
}
