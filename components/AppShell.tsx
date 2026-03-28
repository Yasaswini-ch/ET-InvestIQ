"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { MessageCircleMore, X } from "lucide-react";
import ChatDrawer from "@/components/ChatDrawer";

interface NavItem {
  label: string;
  href: string;
  accent?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "My Portfolio", href: "/xray" },
  { label: "Features", href: "/#features" },
  { label: "Markets", href: "/radar" },
  { label: "Protect", href: "/scamcheck", accent: "text-red-400" },
  { label: "Learn", href: "/newbies" },
  { label: "Chat ✦", href: "/chat", accent: "text-emerald-400" },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const isLanding = pathname === "/";
  const isChatPage = pathname === "/chat";
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [hasPortfolioContext, setHasPortfolioContext] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const readContext = () => {
      try {
        setHasPortfolioContext(Boolean(localStorage.getItem("xray_result")));
      } catch {
        setHasPortfolioContext(false);
      }
    };

    readContext();
    window.addEventListener("storage", readContext);
    return () => window.removeEventListener("storage", readContext);
  }, [pathname]);

  return (
    <div className="bg-black text-white min-h-screen">
      {!isLanding && (
        <nav className="fixed top-4 left-0 right-0 z-50 px-6">
          <div className="max-w-7xl mx-auto flex items-center gap-4 liquid-glass-strong rounded-full px-5 py-2.5">
            <Link
              href="/"
              className="flex items-center gap-2 font-heading italic text-lg font-normal text-white shrink-0"
            >
              ET InvestIQ
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            </Link>

            <div className="hidden md:flex items-center gap-1 liquid-glass rounded-full px-2 py-1 flex-1 justify-center">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                      isActive
                        ? "bg-white/15 text-white"
                        : item.accent
                        ? `${item.accent} hover:text-white`
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}
      <main className={isLanding ? "" : "pt-24 pb-16 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto"}>
        {children}
      </main>

      {!isChatPage && (
        <>
          <button
            onClick={() => setChatDrawerOpen((open) => !open)}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-[999] liquid-glass-strong inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-emerald-300 shadow-2xl shadow-black/40 border border-emerald-400/30 bg-emerald-500/10 backdrop-blur-xl hover:border-emerald-400/50 hover:bg-emerald-500/15 transition-all"
            aria-label={chatDrawerOpen ? "Close AI Assistant" : "Open AI Assistant"}
          >
            {hasPortfolioContext && !chatDrawerOpen && (
              <span className="absolute inset-0 rounded-full border border-emerald-400/30 animate-pulse" />
            )}
            <span className={hasPortfolioContext ? "text-emerald-400 animate-pulse" : ""}>
              {chatDrawerOpen ? <X className="w-4 h-4" /> : <MessageCircleMore className="w-4 h-4" />}
            </span>
            <span>Ask AI</span>
          </button>

          <ChatDrawer isOpen={chatDrawerOpen} onClose={() => setChatDrawerOpen(false)} />
        </>
      )}
    </div>
  );
}

