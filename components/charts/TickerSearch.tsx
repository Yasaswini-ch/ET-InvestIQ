"use client";

import { Search } from "lucide-react";

export default function TickerSearch({
  value,
  onChange,
  onSubmit,
  loading,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <div className="liquid-glass rounded-xl p-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-white/60 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmit();
            }}
            placeholder="Search NSE ticker (e.g. RELIANCE, TCS, INFY)"
            className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-lg py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-white/20"
          />
        </div>
        <button
          onClick={onSubmit}
          disabled={loading || !value.trim()}
          className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-4 py-2.5 text-sm font-bold disabled:opacity-60"
        >
          {loading ? "Loading..." : "Analyze"}
        </button>
      </div>
    </div>
  );
}
