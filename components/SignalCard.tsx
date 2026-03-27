"use client";

import { useState } from "react";
import { ArrowUpRight, ChevronDown, Bookmark, BookmarkCheck } from "lucide-react";

interface SignalCardProps {
  signal: any;
  isWatchlisted?: boolean;
  onWatchlistToggle?: (id: string) => void;
}

export default function SignalCard({ signal, isWatchlisted = false, onWatchlistToggle }: SignalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isHighConviction = signal.conviction === "high";
  const confidencePct = isHighConviction ? 82 : 61;

  const upside = signal.targetPrice && signal.currentPrice
    ? (((signal.targetPrice - signal.currentPrice) / signal.currentPrice) * 100).toFixed(1)
    : null;

  return (
    <div className={`liquid-glass rounded-2xl border transition-all duration-200 overflow-hidden ${
      isHighConviction ? "border-emerald-400/20" : "border-yellow-400/20"
    }`}>
      <div className={`h-1 w-full ${isHighConviction ? "bg-emerald-500" : "bg-yellow-500"}`}></div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
              {signal.type.replace(/_/g, " ")}
            </p>
            <h3 className="text-lg font-bold text-white font-display leading-tight truncate">{signal.companyName}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-emerald-400 text-xs font-bold">{signal.ticker}</p>
              <span className="text-[10px] text-white/40 font-medium">{signal.sector}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
              isHighConviction
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-400/20"
                : "bg-yellow-500/10 text-yellow-400 border border-yellow-400/20"
            }`}>
              {signal.conviction.toUpperCase()}
            </div>
            {onWatchlistToggle && (
              <button
                onClick={() => onWatchlistToggle(signal.id)}
                className={`p-1.5 rounded-lg border transition-all ${
                  isWatchlisted
                    ? "bg-emerald-500/10 border-emerald-400/20 text-emerald-400"
                    : "bg-white/5 border-white/10 text-white/40 hover:text-emerald-400 hover:border-emerald-400/20"
                }`}
                title={isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
              >
                {isWatchlisted ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center mb-4">
          <div className="bg-white/5 rounded-lg p-2.5">
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider mb-1">Current</p>
            <p className="text-sm font-bold text-white">{"\u20B9"}{signal.currentPrice}</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-400/20 rounded-lg p-2.5">
            <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Target</p>
            <p className="text-sm font-bold text-emerald-400 flex items-center justify-center gap-0.5">
              {"\u20B9"}{signal.targetPrice} <ArrowUpRight className="w-3 h-3" />
            </p>
          </div>
          <div className="bg-red-500/10 border border-red-400/20 rounded-lg p-2.5">
            <p className="text-[9px] font-bold text-red-400 uppercase tracking-wider mb-1">Stop Loss</p>
            <p className="text-sm font-bold text-red-400">{"\u20B9"}{signal.stopLoss}</p>
          </div>
        </div>

        {signal.eventDate && (
          <p className="text-[10px] text-white/40 mb-2">
            Event Date: {new Date(signal.eventDate).toLocaleDateString("en-IN")}
          </p>
        )}

        {upside && (
          <div className="mb-3 flex items-center gap-2 text-xs">
            <span className="text-white/60">Upside potential:</span>
            <span className={`font-bold ${parseFloat(upside) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {parseFloat(upside) >= 0 ? "+" : ""}{upside}%
            </span>
            <span className="text-white/40">· {signal.timeframe}</span>
          </div>
        )}

        <div className="mb-4">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1.5">
            <span>Confidence</span>
            <span className={isHighConviction ? "text-emerald-400" : "text-yellow-400"}>{confidencePct}%</span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <div
              className={`h-full transition-all duration-500 ${isHighConviction ? "bg-emerald-500" : "bg-yellow-500"}`}
              style={{ width: `${confidencePct}%` }}
            />
          </div>
        </div>

        {Array.isArray(signal.sources) && signal.sources.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Sources</p>
            <div className="flex flex-wrap gap-1.5">
              {signal.sources.slice(0, 3).map((source: any, i: number) => (
                <a
                  key={i}
                  className="text-[10px] font-bold px-2 py-1 rounded-full border liquid-glass border-white/10 text-white/60 hover:text-emerald-400 hover:border-emerald-400/30 transition-all"
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {source.publisher}
                </a>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-emerald-400 text-xs font-bold hover:text-emerald-300 transition-colors"
        >
          {isExpanded ? "Hide" : "Show"} Reasoning
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
        </button>

        {isExpanded && (
          <div className="mt-4 space-y-3 pt-4 border-t border-white/10">
            <div>
              <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider mb-1">Reasoning</h4>
              <p className="text-xs text-white/60 leading-relaxed">{signal.reasoning}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider mb-1">Catalysts</h4>
              <ul className="space-y-1">
                {signal.catalysts.map((c: string, i: number) => (
                  <li key={i} className="text-xs text-white/60 flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider mb-1">Risks</h4>
              <ul className="space-y-1">
                {signal.risks.map((r: string, i: number) => (
                  <li key={i} className="text-xs text-white/60 flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 flex-shrink-0"></span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            {Array.isArray(signal.sources) && signal.sources.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider mb-1">Source Links</h4>
                <ul className="space-y-1">
                  {signal.sources.map((source: any, i: number) => (
                    <li key={i} className="text-xs text-white/60">
                      <a
                        className="text-emerald-400 hover:underline"
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {source.publisher}: {source.title.slice(0, 80)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
