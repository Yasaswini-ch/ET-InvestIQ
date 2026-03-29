"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { MoodResponse } from "@/lib/types/mood";

const FALLBACK_MOOD: MoodResponse = {
  mood: "NEUTRAL",
  niftyChange: 0.12,
  vix: 14.8,
  fiiFlow: "Mixed",
  label: "Balanced tape",
  color: "bg-white/10 text-white/80 border-white/15",
};

export default function MarketMoodIndicator({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<MoodResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const loadMood = async () => {
    setLoading(true);
    setFailed(false);
    try {
      const response = await fetch("/api/mood");
      const payload = (await response.json().catch(() => null)) as MoodResponse | null;
      setData(payload ?? FALLBACK_MOOD);
    } catch {
      setData(FALLBACK_MOOD);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMood();
  }, []);

  if (loading) {
    return (
      <div className="liquid-glass rounded-2xl border border-white/10 p-4">
        <div className="shimmer h-5 w-32 rounded-full" />
        <div className="shimmer mt-3 h-4 w-56 rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="liquid-glass rounded-2xl border border-white/10 p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-white/60 text-sm">
          <AlertCircle className="w-4 h-4 text-amber-300" />
          Mood indicator unavailable right now.
        </div>
        <button onClick={() => void loadMood()} className="text-xs text-emerald-300 hover:text-emerald-200">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`liquid-glass rounded-2xl border border-white/10 ${compact ? "p-3" : "p-4"}`}>
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <motion.div
          animate={{ opacity: [0.8, 1, 0.8], scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide ${data.color}`}
        >
          <span className="inline-flex h-2 w-2 rounded-full bg-current opacity-80" />
          {data.mood}
        </motion.div>
        {failed && (
          <button
            onClick={() => void loadMood()}
            className="inline-flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70"
          >
            <RefreshCcw className="w-3 h-3" />
            Data delayed
          </button>
        )}
      </div>
      <p className={`text-white/65 ${compact ? "text-xs" : "text-sm"} mt-2`}>
        NIFTY 50: {data.niftyChange >= 0 ? "+" : ""}{data.niftyChange.toFixed(2)}% today · FII: {data.fiiFlow} · VIX: {data.vix.toFixed(1)}
      </p>
    </div>
  );
}

