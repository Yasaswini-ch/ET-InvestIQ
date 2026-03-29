"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Plus, Search, RefreshCcw } from "lucide-react";
import LiveDataStatus from "@/components/LiveDataStatus";
import PageHeader from "@/components/PageHeader";
import RiskNotice from "@/components/RiskNotice";
import { formatCurrencyINR } from "@/lib/currency";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { STORAGE_KEYS, readStoredJson, writeStoredJson } from "@/lib/storage";
import { WatchlistSignalsResponse } from "@/lib/types/watchlist";

const SUGGESTIONS = [
  "RELIANCE",
  "TCS",
  "INFY",
  "HDFCBANK",
  "ICICIBANK",
  "SBIN",
  "LT",
  "TATAMOTORS",
  "SUNPHARMA",
  "BHARTIARTL",
  "ITC",
  "ASIANPAINT",
];

export default function WatchlistPage() {
  const [query, setQuery] = useState("");
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [data, setData] = useState<WatchlistSignalsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = readStoredJson<string[]>(STORAGE_KEYS.watchlist) ?? [];
    setWatchlist(stored);
  }, []);

  useEffect(() => {
    writeStoredJson(STORAGE_KEYS.watchlist, watchlist);
  }, [watchlist]);

  const filteredSuggestions = useMemo(() => {
    if (!query.trim()) return SUGGESTIONS.slice(0, 6);
    const normalized = query.toUpperCase();
    return SUGGESTIONS.filter((ticker) => ticker.startsWith(normalized) || ticker.includes(normalized)).slice(0, 6);
  }, [query]);

  const loadSignals = async (symbols = watchlist) => {
    if (!symbols.length) {
      setData({ tickers: [] });
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/watchlist/signals?tickers=${encodeURIComponent(symbols.join(","))}`);
      const payload = (await response.json().catch(() => null)) as WatchlistSignalsResponse | null;
      if (!payload) throw new Error("Unable to load watchlist");
      setData(payload);
    } catch {
      setError("Could not load live watchlist signals right now.");
      setData({ tickers: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSignals();
  }, [watchlist]);

  const addTicker = (value: string) => {
    const normalized = value.trim().toUpperCase();
    if (!normalized || watchlist.includes(normalized)) return;
    setWatchlist((current) => [normalized, ...current].slice(0, 12));
    setQuery("");
  };

  const removeTicker = (symbol: string) => {
    setWatchlist((current) => current.filter((item) => item !== symbol));
  };

  const highRiskCount = data?.tickers.reduce((sum, ticker) => sum + ticker.signals.length, 0) ?? 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Watchlist"
        description="Track your favourite tickers and surface Radar signals against them automatically."
      />

      <LiveDataStatus
        label="Watchlist signals"
        timestamp={data?.generatedAt ?? null}
        fallbackUsed={Boolean(data?.fallbackUsed || error)}
        staleMessage="Quote or Radar feeds are delayed. Prices and active signal badges may be stale until the next successful refresh."
        onRetry={() => void loadSignals()}
      />

      <RiskNotice
        title="Watchlist is a monitoring layer"
        body="Watchlist badges highlight activity worth reviewing. They are not recommendations and should be checked against live exchange data before you act."
      />

      <div className="liquid-glass rounded-2xl border border-white/10 p-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs uppercase tracking-[0.18em] text-white/40">Search NSE / BSE ticker</label>
            <div className="mt-2 flex items-center rounded-xl border border-white/10 bg-black/30 px-3">
              <Search className="w-4 h-4 text-white/35" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value.toUpperCase())}
                placeholder="Type RELIANCE, TCS, INFY..."
                className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-white/25"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {filteredSuggestions.map((ticker) => (
                <button key={ticker} onClick={() => addTicker(ticker)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/65 hover:text-white">
                  {ticker}
                </button>
              ))}
            </div>
          </div>
          <div className="md:self-end">
            <button onClick={() => addTicker(query)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-medium text-black md:w-auto">
              <Plus className="w-4 h-4" />
              Add to Watchlist
            </button>
          </div>
        </div>
      </div>

      <div className="liquid-glass rounded-2xl border border-white/10 p-4 text-sm text-white/65 flex flex-wrap items-center justify-between gap-3">
        <span>{watchlist.length} tickers tracked</span>
        <span>{highRiskCount} active Radar signals</span>
        <button onClick={() => void loadSignals()} className="inline-flex items-center gap-2 text-white/65 hover:text-white">
          <RefreshCcw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[0, 1, 2].map((item) => <div key={item} className="shimmer h-40 rounded-2xl" />)}
        </div>
      )}

      {error && !loading && (
        <div className="liquid-glass rounded-2xl border border-red-500/20 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-red-300">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
          <button onClick={() => void loadSignals()} className="text-xs text-white/70 hover:text-white">Retry</button>
        </div>
      )}

      {!loading && !watchlist.length && (
        <div className="liquid-glass rounded-2xl border border-white/10 p-8 text-center text-white/55">
          Add tickers you&apos;re watching - we&apos;ll surface Radar signals for them automatically.
        </div>
      )}

      {!loading && !!watchlist.length && !!data?.tickers.length && (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.tickers.map((ticker) => (
            <motion.div key={ticker.symbol} variants={staggerItem} className="liquid-glass rounded-2xl border border-white/10 p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-white">{ticker.symbol}</p>
                  <p className="text-sm text-white/55">{ticker.price > 0 ? formatCurrencyINR(ticker.price) : "Quote delayed"}</p>
                </div>
                <button onClick={() => removeTicker(ticker.symbol)} className="text-xs text-white/40 hover:text-white">Remove</button>
              </div>

              <div className={`text-sm font-medium ${ticker.changePercent >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                {ticker.changePercent >= 0 ? "+" : ""}{ticker.changePercent.toFixed(2)}% today
              </div>

              <div className="flex flex-wrap gap-2">
                {ticker.signals.length > 0 ? ticker.signals.map((signal) => (
                  <span key={`${ticker.symbol}-${signal.type}`} className="rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-[11px] text-amber-200">
                    {signal.type} · {signal.conviction}
                  </span>
                )) : <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/45">No active signals</span>}
              </div>

              {ticker.signals[0] && (
                <p className="text-sm text-white/65 leading-relaxed">{ticker.signals[0].summary}</p>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

