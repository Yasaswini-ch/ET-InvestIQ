"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const NAV_ITEMS = [
  { label: "X-Ray", href: "/xray" },
  { label: "Radar", href: "/radar" },
  { label: "Chat", href: "/chat" },
  { label: "Charts", href: "/charts" },
  { label: "Learn", href: "/newbies" },
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
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? "bg-white/15 text-white"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
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
