"use client";

export default function IntelligenceLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-16">
      <div className="liquid-glass rounded-2xl border border-white/10 px-6 py-8 text-center">
        <div className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin" />
        <p className="text-sm font-medium text-white/70">Loading intelligence layers...</p>
      </div>
    </div>
  );
}

