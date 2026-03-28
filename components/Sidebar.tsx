﻿﻿﻿"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, Microscope, Radar, MessageSquare, TrendingUp, HelpCircle, LogOut, CandlestickChart, GraduationCap } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: BarChart3 },
  { href: '/xray', label: 'Portfolio X-Ray', icon: Microscope },
  { href: '/radar', label: 'Opportunity Radar', icon: Radar },
  { href: '/charts', label: 'Chart Intelligence', icon: CandlestickChart },
  { href: '/chat', label: 'Market Intelligence', icon: MessageSquare },
  { href: '/newbies', label: 'Newbie Corner', icon: GraduationCap },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-white border-r border-[#E8DDD2] flex flex-col z-50 shadow-sm">
      {/* Logo */}
      <div className="p-6 border-b border-[#E8DDD2]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#E8651A] rounded-xl flex items-center justify-center shadow-md shadow-orange-200">
            <TrendingUp className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#111827] tracking-tight leading-none">InvestIQ</h1>
            <p className="text-[10px] text-[#6B7280] font-medium mt-0.5">by ET Markets</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        <p className="px-3 text-[9px] font-bold text-[#6B7280] uppercase tracking-widest mb-3">Main Menu</p>
        <ul>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href} className="mb-0.5">
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group ${
                    isActive
                      ? 'bg-[#FFF0E6] text-[#E8651A] font-semibold'
                      : 'text-[#374151] hover:bg-[#F7F0E8] hover:text-[#111827]'
                  }`}
                >
                  <item.icon className={`mr-3 w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#E8651A]' : 'text-[#6B7280] group-hover:text-[#374151]'}`} />
                  {item.label}
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#E8651A]"></span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Portfolio Health Widget */}
      <div className="px-3 pb-3">
        <div className="bg-[#FFF0E6] border border-orange-100 p-4 rounded-xl relative overflow-hidden">
          <p className="text-[10px] font-bold text-[#E8651A] uppercase tracking-wider mb-1">Portfolio Health</p>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold text-[#111827]">72.4</p>
            <p className="text-[10px] text-[#059669] font-bold mb-1">+2.1%</p>
          </div>
          <div className="w-full h-1.5 bg-orange-100 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-[#E8651A] w-[72%] rounded-full"></div>
          </div>
          <p className="text-[10px] text-[#6B7280] mt-2">Good - room to optimize</p>
        </div>
      </div>

      {/* Bottom Links */}
      <div className="px-3 py-4 border-t border-[#E8DDD2] space-y-0.5">
        <Link href="/help" className="flex items-center px-3 py-2 text-sm text-[#6B7280] hover:text-[#374151] hover:bg-[#F7F0E8] rounded-lg transition-colors">
          <HelpCircle className="mr-3 w-4 h-4" />
          Support
        </Link>
        <button className="flex items-center px-3 py-2 text-sm text-[#DC2626]/70 hover:text-[#DC2626] hover:bg-red-50 rounded-lg transition-colors w-full">
          <LogOut className="mr-3 w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}

