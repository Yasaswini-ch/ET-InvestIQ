"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Check, Loader2 } from "lucide-react";
import BudgetAnnouncementPicker from "./BudgetAnnouncementPicker";
import { BUDGET_2026_ANNOUNCEMENTS } from "@/lib/intelligence/budgetAnnouncements";
import { BudgetAnalysisResult } from "@/lib/types/intelligence";

type Props = {
  portfolioContext: Record<string, unknown> | null;
};

export default function Layer1Budget({ portfolioContext }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BudgetAnalysisResult | null>(null);
  const [error, setError] = useState("");

  const selectedCount = selectedIds.length;

  const selectedAnnouncements = useMemo(
    () => BUDGET_2026_ANNOUNCEMENTS.filter((announcement) => selectedIds.includes(announcement.id)),
    [selectedIds]
  );

  const analyzeBudget = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res = await fetch("/api/intelligence/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedAnnouncements: selectedIds, portfolioContext }),
      });

      const data = (await res.json().catch(() => null)) as BudgetAnalysisResult | null;
      if (!res.ok) {
        throw new Error((data as { error?: string } | null)?.error || "Analysis failed");
      }

      setResult(data);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Failed to analyze budget impact.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(BUDGET_2026_ANNOUNCEMENTS.map((announcement) => announcement.id));
  };

  const handleClear = () => {
    setSelectedIds([]);
    setResult(null);
    setError("");
  };

  return (
    <div className="space-y-6">
      {!result && !loading && (
        <BudgetAnnouncementPicker
          announcements={BUDGET_2026_ANNOUNCEMENTS}
          selectedIds={selectedIds}
          onToggle={handleToggle}
          onSelectAll={handleSelectAll}
          onClear={handleClear}
        />
      )}

      {error && <div className="text-red-400 p-4 border border-red-500/20 bg-red-500/5 rounded-xl text-sm">{error}</div>}

      {loading && (
        <div className="flex flex-col items-center justify-center p-12 text-blue-400 gap-3 bg-blue-500/5 rounded-2xl border border-blue-500/10">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm font-body">
            Cross-referencing {selectedCount} selected announcement{selectedCount === 1 ? "" : "s"}...
          </span>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="liquid-glass rounded-2xl p-5 border border-white/5 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase ${
                  result.overallImpact === "positive"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : result.overallImpact === "negative"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                Overall Impact: {result.overallImpact}
              </span>
              {result.deadline && (
                <span className="inline-flex items-center gap-2 text-red-400 text-xs font-semibold uppercase tracking-widest">
                  <CalendarClock className="w-4 h-4" />
                  Deadline: {result.deadline}
                </span>
              )}
            </div>
            <p className="text-white/60 text-sm leading-relaxed">{result.impactSummary}</p>
          </div>

          {result.items.map((item) => (
            <div key={item.announcementId} className="liquid-glass rounded-xl p-5 mb-3 border border-white/5">
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-white font-body font-medium text-sm">{item.announcementTitle}</h4>
                <span
                  className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                    item.urgency === "act_now"
                      ? "bg-red-500/20 text-red-400"
                      : item.urgency === "review_before_april"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : item.urgency === "monitor"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-white/10 text-white/50"
                  }`}
                >
                  {item.urgency.replace(/_/g, " ")}
                </span>
              </div>

              <p className="text-2xl font-heading italic text-white mt-2">{item.rupeesImpact}</p>
              <p className="text-white/60 text-sm mt-1 leading-relaxed">{item.impactOnInvestor}</p>

              {item.affectedFunds.length > 0 && (
                <div className="mt-3">
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Affects your funds:</p>
                  <div className="flex flex-wrap gap-2">
                    {item.affectedFunds.map((fund) => (
                      <span
                        key={fund}
                        className="liquid-glass rounded-full px-2 py-0.5 text-xs text-emerald-400 border border-emerald-500/20"
                      >
                        {fund}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white/5 rounded-lg px-3 py-2 mt-3">
                <p className="text-emerald-400 text-xs">→ {item.action}</p>
              </div>
            </div>
          ))}

          <div className="liquid-glass rounded-xl p-4 border border-blue-500/20">
            <p className="text-blue-400 text-[10px] uppercase font-bold tracking-widest mb-1">Your #1 Budget Action</p>
            <p className="text-white text-sm font-medium">{result.topAction}</p>
          </div>

          <button onClick={handleClear} className="w-full text-center text-white/40 text-xs hover:text-white mt-2 font-bold uppercase">
            Back to Announcements
          </button>
        </div>
      )}

      {!result && !loading && (
        <div className="flex justify-center mt-6">
          <button
            disabled={selectedCount === 0}
            onClick={analyzeBudget}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-black px-6 py-2.5 rounded-full font-body font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Check className="w-4 h-4" />
            Analyse {selectedCount > 0 ? `${selectedCount} Selected Announcements` : "Selected Announcements"}
          </button>
        </div>
      )}
    </div>
  );
}
