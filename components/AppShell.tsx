"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  accent?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "X-Ray", href: "/xray" },
  { label: "Radar", href: "/radar" },
  { label: "My Briefing", href: "/briefing", accent: "text-emerald-400 glow" },
  { label: "Chat", href: "/chat" },
  { label: "Charts", href: "/charts" },
  { label: "SIP Tools", href: "/sip" },
  { label: "Learn", href: "/newbies" },
  { label: "Scam Shield", href: "/scamcheck", icon: Shield, accent: "text-red-400" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <div className="bg-black text-white min-h-screen">
      {!isLanding && (
        <nav className="fixed top-4 left-0 right-0 z-50 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between liquid-glass-strong rounded-full px-5 py-2.5">
            <Link href="/" className="flex items-center gap-2 font-heading italic text-lg font-normal text-white">
              ET InvestIQ
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            </Link>

            <div className="hidden md:flex items-center gap-1 liquid-glass rounded-full px-2 py-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
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
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <Link
              href="/xray"
              className="liquid-glass-strong rounded-full px-4 py-2 text-sm font-semibold text-white flex items-center gap-1.5 hover:bg-white/10 transition-all"
            >
              Launch App <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </nav>
      )}
      <main className={isLanding ? "" : "pt-24 pb-16 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto"}>
        {children}
      </main>
    </div>
  );
}
