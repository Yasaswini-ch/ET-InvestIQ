"use client";

import { useState } from "react";
import { ArrowUpRight, Bookmark, BookmarkCheck, ChevronDown } from "lucide-react";
import { RadarPortfolioImpact } from "@/lib/radar/portfolioImpact";
import { RadarSignal } from "@/lib/types/radar";

interface SignalCardProps {
  signal: RadarSignal;
  isWatchlisted?: boolean;
  onWatchlistToggle?: (id: string) => void;
  portfolioImpact?: RadarPortfolioImpact;
}

function formatRupees(value?: number) {
  if (typeof value !== "number") return "n/a";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function SignalCard({
  signal,
  isWatchlisted = false,
  onWatchlistToggle,
  portfolioImpact,
}: SignalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isHighConviction = signal.conviction === "high";
  const confidencePct = signal.signalScore ?? (isHighConviction ? 82 : 61);

  const upside =
    signal.targetPrice && signal.currentPrice
      ? (((signal.targetPrice - signal.currentPrice) / signal.currentPrice) * 100).toFixed(1)
      : null;
  const hasTradeLevels =
    typeof signal.currentPrice === "number" ||
    typeof signal.targetPrice === "number" ||
    typeof signal.stopLoss === "number";

  return (
    <div
      className={`liquid-glass rounded-2xl border transition-all duration-200 overflow-hidden ${
        isHighConviction ? "border-emerald-400/20" : "border-yellow-400/20"
      }`}
    >
      <div className={`h-1 w-full ${isHighConviction ? "bg-emerald-500" : "bg-yellow-500"}`}></div>

      <div className="p-5">
        <div className="mb-4 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
              {signal.type.replace(/_/g, " ")}
            </p>
            <h3 className="truncate text-lg font-bold leading-tight text-white font-display">{signal.companyName}</h3>
            <div className="mt-0.5 flex items-center gap-2">
              <p className="text-xs font-bold text-emerald-400">{signal.ticker}</p>
              <span className="text-[10px] font-medium text-white/40">{signal.sector ?? "India"}</span>
            </div>
          </div>

          <div className="ml-2 flex flex-shrink-0 items-center gap-2">
            <div
              className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                isHighConviction
                  ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-400"
                  : "border border-yellow-400/20 bg-yellow-500/10 text-yellow-400"
              }`}
            >
              {signal.conviction.toUpperCase()}
            </div>
            {onWatchlistToggle && (
              <button
                onClick={() => onWatchlistToggle(signal.id)}
                className={`rounded-lg border p-1.5 transition-all ${
                  isWatchlisted
                    ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-400"
                    : "border-white/10 bg-white/5 text-white/40 hover:border-emerald-400/20 hover:text-emerald-400"
                }`}
                title={isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
              >
                {isWatchlisted ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </div>

        {hasTradeLevels ? (
          <div className="mb-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-white/5 p-2.5">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-white/40">Current</p>
              <p className="text-sm font-bold text-white">{formatRupees(signal.currentPrice)}</p>
            </div>
            <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-2.5">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400">Target</p>
              <p className="flex items-center justify-center gap-0.5 text-sm font-bold text-emerald-400">
                {formatRupees(signal.targetPrice)} <ArrowUpRight className="h-3 w-3" />
              </p>
            </div>
            <div className="rounded-lg border border-red-400/20 bg-red-500/10 p-2.5">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-red-400">Stop Loss</p>
              <p className="text-sm font-bold text-red-400">{formatRupees(signal.stopLoss)}</p>
            </div>
          </div>
        ) : (
          <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">Trade Levels Pending</p>
            <p className="mt-1 text-xs leading-relaxed text-white/70">
              This signal came through, but live quote-derived entry, target, and stop levels are temporarily unavailable.
              Use the event thesis and source links first, then confirm levels before acting.
            </p>
          </div>
        )}

        {(signal.whySignal || signal.whyItMatters || signal.changeSummary) && (
          <div className="mb-4 space-y-2">
            {signal.whySignal && (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Why This Is A Signal</p>
                <p className="mt-1 text-xs leading-relaxed text-white/75">{signal.whySignal}</p>
              </div>
            )}
            {signal.whyItMatters && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">Why This Matters</p>
                <p className="mt-1 text-xs leading-relaxed text-white/70">{signal.whyItMatters}</p>
              </div>
            )}
            {signal.changeSummary && (
              <div className="rounded-xl border border-amber-400/20 bg-amber-500/5 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">What Changed</p>
                <p className="mt-1 text-xs leading-relaxed text-white/75">{signal.changeSummary}</p>
              </div>
            )}
          </div>
        )}

        {portfolioImpact && (
          <div
            className={`mb-4 rounded-xl border p-3 ${
              portfolioImpact.status === "direct"
                ? "border-emerald-400/20 bg-emerald-500/5"
                : portfolioImpact.status === "thematic"
                  ? "border-amber-400/20 bg-amber-500/5"
                  : "border-white/10 bg-white/5"
            }`}
          >
            <p
              className={`text-[10px] font-bold uppercase tracking-wider ${
                portfolioImpact.status === "direct"
                  ? "text-emerald-300"
                  : portfolioImpact.status === "thematic"
                    ? "text-amber-300"
                    : "text-white/45"
              }`}
            >
              {portfolioImpact.title}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/75">{portfolioImpact.detail}</p>
            {(portfolioImpact.matchedHolding || typeof portfolioImpact.exposurePercent === "number") && (
              <div className="mt-2 flex flex-wrap gap-2">
                {portfolioImpact.matchedHolding && (
                  <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] text-white/70">
                    Match: {portfolioImpact.matchedHolding}
                  </span>
                )}
                {typeof portfolioImpact.exposurePercent === "number" && (
                  <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] text-white/70">
                    Exposure: {portfolioImpact.exposurePercent}%
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {signal.eventDate && (
          <p className="mb-2 text-[10px] text-white/40">Event Date: {new Date(signal.eventDate).toLocaleDateString("en-IN")}</p>
        )}

        {upside && (
          <div className="mb-3 flex items-center gap-2 text-xs">
            <span className="text-white/60">Upside potential:</span>
            <span className={`font-bold ${parseFloat(upside) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {parseFloat(upside) >= 0 ? "+" : ""}
              {upside}%
            </span>
            <span className="text-white/40">| {signal.timeframe}</span>
          </div>
        )}

        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-white/60">
            <span>Signal Score</span>
            <span className={confidencePct >= 75 ? "text-emerald-400" : confidencePct >= 55 ? "text-yellow-400" : "text-blue-400"}>
              {confidencePct}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-white/5">
            <div
              className={`h-full transition-all duration-500 ${confidencePct >= 75 ? "bg-emerald-500" : confidencePct >= 55 ? "bg-yellow-500" : "bg-blue-500"}`}
              style={{ width: `${confidencePct}%` }}
            />
          </div>
        </div>

        {Array.isArray(signal.sources) && signal.sources.length > 0 && (
          <div className="mb-4">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">Sources</p>
            <div className="flex flex-wrap gap-1.5">
              {signal.sources.slice(0, 3).map((source, index) => (
                <a
                  key={`${source.publisher}-${index}`}
                  className="liquid-glass rounded-full border border-white/10 px-2 py-1 text-[10px] font-bold text-white/60 transition-all hover:border-emerald-400/30 hover:text-emerald-400"
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
          className="flex items-center gap-1 text-xs font-bold text-emerald-400 transition-colors hover:text-emerald-300"
        >
          {isExpanded ? "Hide" : "Show"} Deep Dive
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
        </button>

        {isExpanded && (
          <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
            <div>
              <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-white/80">Reasoning</h4>
              <p className="text-xs leading-relaxed text-white/60">{signal.reasoning}</p>
            </div>
            <div>
              <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-white/80">Catalysts</h4>
              <ul className="space-y-1">
                {signal.catalysts.map((catalyst, index) => (
                  <li key={`${signal.id}-c-${index}`} className="flex items-start gap-1.5 text-xs text-white/60">
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-emerald-400"></span>
                    {catalyst}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-white/80">Risks</h4>
              <ul className="space-y-1">
                {signal.risks.map((risk, index) => (
                  <li key={`${signal.id}-r-${index}`} className="flex items-start gap-1.5 text-xs text-white/60">
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-red-400"></span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
            {signal.sources.length > 0 && (
              <div>
                <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-white/80">Source Links</h4>
                <ul className="space-y-1">
                  {signal.sources.map((source, index) => (
                    <li key={`${signal.id}-s-${index}`} className="text-xs text-white/60">
                      <a className="text-emerald-400 hover:underline" href={source.url} target="_blank" rel="noreferrer">
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
