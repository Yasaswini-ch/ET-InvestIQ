"use client";

import { Search, Bell, User, Settings } from 'lucide-react';

export default function TopNav() {
  return (
    <header className="fixed top-0 right-0 left-60 h-14 bg-white/90 backdrop-blur-md border-b border-[#E8DDD2] z-50 flex items-center justify-between px-6">
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search markets, funds, signals..."
            className="w-full bg-[#F7F0E8] border border-[#E8DDD2] rounded-full py-1.5 pl-9 pr-4 text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#E8651A]/30 focus:border-[#E8651A] transition-all placeholder:text-[#9CA3AF]"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative text-[#6B7280] hover:text-[#374151] transition-colors p-1">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#E8651A] rounded-full"></span>
        </button>
        <button className="text-[#6B7280] hover:text-[#374151] transition-colors p-1">
          <Settings className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2.5 pl-4 border-l border-[#E8DDD2]">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-[#111827]">Rahul Sharma</p>
            <p className="text-[10px] text-[#6B7280]">Premium Plan</p>
          </div>
          <div className="w-8 h-8 bg-[#E8651A] rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
            RS
          </div>
        </div>
      </div>
    </header>
  );
}
