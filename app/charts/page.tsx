"use client";

import { useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import OhlcvChart from "@/components/charts/OhlcvChart";
import TickerSearch from "@/components/charts/TickerSearch";
import PatternSummaryCard from "@/components/charts/PatternSummaryCard";
import PatternStatsCard from "@/components/charts/PatternStatsCard";
import { ChartPatternResponse } from "@/lib/types/market";

const RANGE_OPTIONS = ["1mo", "3mo", "6mo", "1y"];

export default function ChartsPage() {
  const [ticker, setTicker] = useState("RELIANCE");
  const [range, setRange] = useState("6mo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ChartPatternResponse | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/charts?ticker=${encodeURIComponent(ticker)}&range=${range}&interval=1d`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to analyze chart");
      setData(body);
    } catch (err: any) {
      setError(err.message || "Failed to analyze chart");
    } finally {
      setLoading(false);
    }
  };

  const isEmpty = useMemo(() => !data || data.candles.length === 0, [data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chart Pattern Intelligence"
        description="Analyze NSE stock charts with real OHLCV data and AI-detected patterns like breakouts, reversals, and support/resistance zones."
      />

      <TickerSearch value={ticker} onChange={setTicker} onSubmit={load} loading={loading} />

      <div className="flex items-center gap-2">
        {RANGE_OPTIONS.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
              range === r ? "bg-white/15 text-white border-white/20" : "liquid-glass border-white/10 text-white/60 hover:text-white"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {error && (
        <div className="liquid-glass rounded-xl p-4 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {!error && isEmpty && (
        <div className="liquid-glass rounded-2xl p-8 text-center text-sm text-white/60">
          Search a ticker and click Analyze to load chart patterns.
        </div>
      )}

      {data && data.candles.length > 0 && (
        <div className="space-y-4">
          <PatternStatsCard
            latestClose={data.summary.latestClose}
            changePercent={data.summary.changePercent}
            trend={data.summary.trend}
            supportZones={data.summary.supportZones}
            resistanceZones={data.summary.resistanceZones}
            volumeSpike={data.summary.volumeSpike}
          />
          <OhlcvChart
            candles={data.candles}
            supportZones={data.summary.supportZones}
            resistanceZones={data.summary.resistanceZones}
            breakoutPoint={data.summary.breakoutPoint}
            patternWindow={data.summary.patternWindow}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.patterns.map((pattern, idx) => (
              <PatternSummaryCard key={`${pattern.name}-${idx}`} pattern={pattern} />
            ))}
          </div>
          {Array.isArray(data.similarHistorical) && data.similarHistorical.length > 0 && (
            <div className="liquid-glass rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-3">Similar Historical Patterns</h3>
              <div className="space-y-2">
                {data.similarHistorical.map((line, idx) => (
                  <p key={idx} className="text-sm text-white/80 leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-white/40 italic">
            AI success rates are model-estimated probabilities and should be treated as educational guidance, not guaranteed outcomes.
          </p>
        </div>
      )}
    </div>
  );
}
