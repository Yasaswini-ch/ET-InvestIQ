"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, Bot, Sparkles, Trash2, Info, Link2, X, History, ChevronRight, BrainCircuit } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { ChatReasoningStep, ChatSource, PortfolioChatContext } from "@/lib/types/chat";
import { STORAGE_KEYS, readStoredJson, removeStoredValue } from "@/lib/storage";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  reasoningSteps?: ChatReasoningStep[];
}

interface ChatSession {
  id: string;
  timestamp: string;
  preview: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}

const PORTFOLIO_CONTEXT_KEY = STORAGE_KEYS.portfolioContext;
const DEFAULT_ASSISTANT_MESSAGE: Message = {
  role: "assistant",
  content: "Hello! I'm ET InvestIQ AI. I can help with NSE/BSE stocks, market structure, and portfolio-driven strategy discussions.",
};

function buildPreview(messages: Message[]) {
  const firstUser = messages.find((message) => message.role === "user")?.content ?? "Conversation";
  return firstUser.slice(0, 60);
}

export default function ChatPage() {
  const modelLabel = process.env.NEXT_PUBLIC_CHAT_MODEL_LABEL || "AI Model";
  const [messages, setMessages] = useState<Message[]>([DEFAULT_ASSISTANT_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [portfolioContext, setPortfolioContext] = useState<PortfolioChatContext | null>(null);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [historyOpen, setHistoryOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([DEFAULT_ASSISTANT_MESSAGE]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const persistCurrentSession = (sessionMessages: Message[]) => {
    const filteredMessages = sessionMessages.filter((message) => message.role === "user" || message.content !== DEFAULT_ASSISTANT_MESSAGE.content);
    const hasUserMessage = filteredMessages.some((message) => message.role === "user");
    if (!hasUserMessage) return;

    const session: ChatSession = {
      id: `session_${Date.now()}`,
      timestamp: new Date().toISOString(),
      preview: buildPreview(filteredMessages),
      messages: filteredMessages.map((message) => ({ role: message.role, content: message.content })),
    };

    const existing = readStoredJson<ChatSession[]>(STORAGE_KEYS.chatHistory) ?? [];
    const deduped = existing.filter((item) => item.preview !== session.preview);
    const next = [session, ...deduped].slice(0, 5);
    localStorage.setItem(STORAGE_KEYS.chatHistory, JSON.stringify(next));
    setHistory(next);
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PORTFOLIO_CONTEXT_KEY);
      if (raw) setPortfolioContext(JSON.parse(raw));
      const storedHistory = readStoredJson<ChatSession[]>(STORAGE_KEYS.chatHistory) ?? [];
      setHistory(storedHistory);
    } catch {
      // Ignore invalid local storage.
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => persistCurrentSession(messagesRef.current);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      persistCurrentSession(messagesRef.current);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
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
          messages: newMessages.map((message) => ({ role: message.role, content: message.content })),
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
          reasoningSteps: Array.isArray(payload.reasoningSteps) ? payload.reasoningSteps : [],
        },
      ]);
      if (Array.isArray(payload.suggested)) setSuggestedQuestions(payload.suggested.slice(0, 2));
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm sorry, I encountered an error. Please try again.", reasoningSteps: [] },
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

  const clearHistory = () => {
    removeStoredValue(STORAGE_KEYS.chatHistory);
    setHistory([]);
  };

  const showQuickActions = messages.length <= 1 && suggestedQuestions.length === 0;
  const recentLabel = useMemo(() => `${history.length} recent`, [history.length]);

  return (
    <div className="max-w-6xl mx-auto">
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
            <button onClick={clearChat} className="liquid-glass p-2.5 rounded-lg text-white/60 hover:text-red-400 transition-all" title="Clear Conversation">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-6 h-[calc(100vh-180px)]">
        <div className="liquid-glass rounded-2xl border border-white/10 overflow-hidden">
          <button onClick={() => setHistoryOpen((current) => !current)} className="w-full px-4 py-4 flex items-center justify-between border-b border-white/10 text-left">
            <span className="inline-flex items-center gap-2 text-sm text-white">
              <History className="w-4 h-4 text-emerald-300" />
              Recent
            </span>
            <span className="text-xs text-white/40 inline-flex items-center gap-1">
              {recentLabel}
              <ChevronRight className={`w-3 h-3 transition-transform ${historyOpen ? "rotate-90" : ""}`} />
            </span>
          </button>

          {historyOpen && (
            <div className="p-3 space-y-2">
              {history.length > 0 ? history.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setMessages(session.messages.map((message) => ({ ...message })))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left hover:bg-white/10"
                >
                  <p className="text-xs text-white/40">{new Date(session.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
                  <p className="mt-1 text-sm text-white/75 line-clamp-2">{session.preview}</p>
                </button>
              )) : (
                <div className="rounded-xl border border-white/10 px-4 py-6 text-sm text-white/45">
                  No saved sessions yet. Start a conversation and we&apos;ll keep your last 5 here.
                </div>
              )}

              <button onClick={clearHistory} className="w-full rounded-xl border border-white/10 px-3 py-2.5 text-sm text-white/55 hover:text-white">
                Clear History
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col liquid-glass rounded-2xl overflow-hidden border border-white/10">
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
                <motion.div key={index} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center border ${msg.role === "user" ? "bg-emerald-500 border-emerald-500 text-white" : "bg-emerald-500/10 border-emerald-400/20 text-emerald-400"}`}>
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className={`flex flex-col max-w-[78%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "bg-white/10 text-white rounded-tr-none" : "bg-white/5 border border-white/10 text-white/80 rounded-tl-none"}`}>
                      {msg.content}
                    </div>
                    {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 space-y-2 max-w-full">
                        <div className="text-[10px] uppercase tracking-wider text-emerald-300">
                          Portfolio-aware output may be imperfect. <a href={msg.sources[0]?.url || "#"} target={msg.sources[0]?.url ? "_blank" : undefined} rel={msg.sources[0]?.url ? "noreferrer" : undefined} className="hover:text-emerald-200 underline underline-offset-2">Verify sources</a>
                        </div>
                        {Array.isArray(msg.reasoningSteps) && msg.reasoningSteps.length > 0 && (
                          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                            <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                              <BrainCircuit className="w-3 h-3" />
                              Reasoning
                            </div>
                            <div className="space-y-2">
                              {msg.reasoningSteps.map((step, stepIndex) => (
                                <div key={`${step.label}-${stepIndex}`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">{step.label}</p>
                                  <p className="mt-1 text-xs leading-relaxed text-white/70">{step.detail}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {msg.sources.slice(0, 3).map((source, sourceIndex) => (
                          <a
                            key={sourceIndex}
                            href={source.url || "#"}
                            target={source.url ? "_blank" : undefined}
                            rel={source.url ? "noreferrer" : undefined}
                            className="block rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-semibold text-white/70 hover:text-emerald-400"
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <Link2 className="w-3 h-3" />
                              {source.title}
                            </span>
                            {source.snippet && <span className="mt-1 block text-[10px] font-normal leading-relaxed text-white/45">{source.snippet}</span>}
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
                <motion.div key="assistant-typing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 flex-row">
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
                    <span className="text-[10px] text-white/40 mt-1 font-semibold uppercase tracking-wider px-1">ET InvestIQ AI</span>
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
                onKeyDown={(e) => e.key === "Enter" && void handleSend()}
                className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-xl py-3.5 pl-5 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-white/20 transition-all"
                placeholder="Ask about Nifty 50, HDFC Bank, sector trends, or portfolio risk..."
              />
              <button onClick={() => void handleSend()} disabled={isLoading || !input.trim()} className="absolute right-2 p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg disabled:bg-white/10 disabled:text-white/30 transition-all">
                <Send className="w-4 h-4" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {suggestedQuestions.length > 0 ? (
                <motion.div key="suggested" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-3 flex flex-wrap gap-2">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider self-center mr-1">Follow up:</span>
                  {suggestedQuestions.map((q, i) => (
                    <QuickAction key={i} label={q} onClick={() => handleSend(q)} />
                  ))}
                </motion.div>
              ) : showQuickActions ? (
                <motion.div key="quick" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-3 flex flex-wrap gap-2">
                  <QuickAction label="Best Large Cap Funds?" onClick={() => handleSend("What are strong large cap funds to study now?")} />
                  <QuickAction label="HDFC Bank Outlook?" onClick={() => handleSend("What is the current outlook for HDFC Bank?")} />
                  <QuickAction label="Nifty Breakout?" onClick={() => handleSend("Is Nifty showing breakout or mean reversion signs?")} />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
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
    <button onClick={onClick} className="px-3 py-1.5 liquid-glass rounded-lg text-[10px] font-semibold text-white/60 hover:text-white transition-all">
      {label}
    </button>
  );
}

