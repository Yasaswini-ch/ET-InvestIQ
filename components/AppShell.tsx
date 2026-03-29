"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { MessageCircleMore, X } from "lucide-react";
import ChatDrawer from "@/components/ChatDrawer";
import { STORAGE_KEYS } from "@/lib/storage";

interface NavItem {
  label: string;
  href: string;
  accent?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "My Portfolio", href: "/xray" },
  { label: "Markets", href: "/radar" },
  { label: "Watchlist", href: "/watchlist" },
  { label: "Videos", href: "/videos" },
  { label: "Protect", href: "/scamcheck", accent: "text-red-400" },
  { label: "Learn", href: "/newbies" },
  { label: "Chat", href: "/chat", accent: "text-emerald-400" },
];

function hasStoredPortfolioContext() {
  if (typeof window === "undefined") return false;
  return Boolean(
    window.localStorage.getItem(STORAGE_KEYS.xrayResult) || window.localStorage.getItem(STORAGE_KEYS.legacyXrayResult)
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const isLanding = pathname === "/";
  const isChatPage = pathname === "/chat";
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [hasPortfolioContext, setHasPortfolioContext] = useState(false);
  const [showShortcutToast, setShowShortcutToast] = useState(false);
  const [showFirstRunHint, setShowFirstRunHint] = useState(false);
  const [focusTrigger, setFocusTrigger] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const readContext = () => setHasPortfolioContext(hasStoredPortfolioContext());
    readContext();

    const onStorage = () => readContext();
    const onFocus = () => readContext();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined" || isChatPage) return;
    if (window.localStorage.getItem(STORAGE_KEYS.shortcutShown)) return;

    setShowFirstRunHint(true);
    window.localStorage.setItem(STORAGE_KEYS.shortcutShown, "1");
    const timer = window.setTimeout(() => setShowFirstRunHint(false), 4000);
    return () => window.clearTimeout(timer);
  }, [isChatPage]);

  useEffect(() => {
    if (typeof document === "undefined" || isChatPage) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/") return;

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isEditable = target?.isContentEditable || tagName === "input" || tagName === "textarea" || tagName === "select";
      if (isEditable) return;

      event.preventDefault();
      setChatDrawerOpen(true);
      setFocusTrigger((current) => current + 1);
      setShowShortcutToast(true);
      window.setTimeout(() => setShowShortcutToast(false), 1800);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isChatPage]);

  return (
    <div className="bg-black text-white min-h-screen">
      {!isLanding && (
        <nav className="fixed top-4 left-0 right-0 z-50 px-6 no-print">
          <div className="max-w-7xl mx-auto flex items-center gap-4 liquid-glass-strong rounded-full px-5 py-2.5">
            <Link href="/" className="flex items-center gap-2 font-heading italic text-lg font-normal text-white shrink-0">
              ET InvestIQ
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            </Link>

            <div className="hidden md:flex items-center gap-1 liquid-glass rounded-full px-2 py-1 flex-1 justify-center">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
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

      <main className={isLanding ? "" : "pt-24 pb-16 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto"}>{children}</main>

      {!isLanding && (
        <footer className="border-t border-white/10 px-6 py-6 text-xs text-white/45 no-print">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
            <p>ET InvestIQ is for informational use only and is not SEBI-registered investment advice.</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/privacy" className="hover:text-white/70">Privacy</Link>
              <Link href="/terms" className="hover:text-white/70">Terms</Link>
              <Link href="/data-use" className="hover:text-white/70">How We Use Data</Link>
              <Link href="/status" className="hover:text-white/70">Status</Link>
              <a href="https://github.com/Yasaswini-ch/ET-InvestIQ/issues" target="_blank" rel="noreferrer" className="hover:text-white/70">
                Report an issue
              </a>
            </div>
          </div>
        </footer>
      )}

      {!isChatPage && (
        <>
          <div className="fixed right-4 top-1/2 -translate-y-1/2 z-[999] no-print">
            {showShortcutToast && (
              <div className="mb-3 rounded-full border border-emerald-400/25 bg-black/80 px-4 py-2 text-xs text-emerald-200 shadow-xl">
                Press / anytime to open
              </div>
            )}
            {showFirstRunHint && (
              <div className="mb-3 animate-pulse rounded-full border border-white/15 bg-black/80 px-4 py-2 text-xs text-white/80 shadow-xl">
                Tip: Press / anywhere to ask AI
              </div>
            )}
            <button
              onClick={() => {
                setChatDrawerOpen((open) => !open);
                setFocusTrigger((current) => current + 1);
              }}
              className="liquid-glass-strong inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-emerald-300 shadow-2xl shadow-black/40 border border-emerald-400/30 bg-emerald-500/10 backdrop-blur-xl hover:border-emerald-400/50 hover:bg-emerald-500/15 transition-all"
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
          </div>

          <ChatDrawer isOpen={chatDrawerOpen} onClose={() => setChatDrawerOpen(false)} focusTrigger={focusTrigger} />
        </>
      )}
    </div>
  );
}

