"use client";

import { useState, useEffect } from "react";
import UnitAccumulationChart from "./UnitAccumulationChart";
import { StayCourseResult } from "@/lib/types/intelligence";
import { Brain, CheckCircle2, TrendingDown } from "lucide-react";
import { formatINR } from "@/lib/utils";

interface Props {
  portfolioContext: any | null;
  isExpanded: boolean;
}

export default function Layer3StayCourse({ portfolioContext, isExpanded }: Props) {
  const [fundName, setFundName] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState<number>(5000);
  const [currentNAV, setCurrentNAV] = useState<number | ''>('');
  const [peakNAV, setPeakNAV] = useState<number | ''>('');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StayCourseResult | null>(null);
  const [error, setError] = useState("");
  
  const [hasCommitted, setHasCommitted] = useState(false);
  const [streakCount, setStreakCount] = useState(0);

  useEffect(() => {
    if (isExpanded) {
       const committed = localStorage.getItem("staycourse_committed") === "true";
       const streak = parseInt(localStorage.getItem("staycourse_streak") ?? "0");
       setHasCommitted(committed);
       setStreakCount(streak);

       if (portfolioContext && !fundName) {
           if (portfolioContext.funds && portfolioContext.funds.length > 0) {
               setFundName(portfolioContext.funds[0].name || portfolioContext.funds[0].fundName || "Parag Parikh Flexi");
               const invested = Number(portfolioContext.totalInvested);
               setMonthlyAmount(invested && !isNaN(invested) ? Math.max(5000, invested / 20) : 5000);
           }
       }
    }
  }, [isExpanded, portfolioContext]);

  const handleCalculate = async () => {
     if (!fundName || !monthlyAmount || !currentNAV || !peakNAV) return;
     setLoading(true);
     setError("");
     try {
       const res = await fetch("/api/intelligence/staycourse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
             monthlyAmount,
             fundName,
             currentNAV: Number(currentNAV),
             peakNAV: Number(peakNAV),
             portfolioContext
          })
       });
       if (!res.ok) throw new Error("Calculation failed");
       const json = await res.json();
       setResult(json);
     } catch (e: any) {
       setError("Engine crunch failed. Try generic numbers.");
     } finally {
       setLoading(false);
     }
  };

  const commitToSIP = () => {
      localStorage.setItem("staycourse_committed", "true");
      const newStreak = streakCount + 1;
      localStorage.setItem("staycourse_streak", newStreak.toString());
      setHasCommitted(true);
      setStreakCount(newStreak);
  };

  return (
    <div className="space-y-6">
      {!result && (
        <div className="liquid-glass rounded-2xl p-6 border border-white/5 bg-white/[0.01]">
          {portfolioContext && (
             <span className="inline-block bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest mb-4">
                Auto-filled from your X-Ray
             </span>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
             <div>
                <label className="text-white/40 text-xs font-bold uppercase mb-1.5 block">Fund tracked</label>
                <input type="text" value={fundName} onChange={e => setFundName(e.target.value)} 
                   className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-emerald-500 outline-none" 
                   placeholder="e.g. Parag Parikh Flexi" />
             </div>
             <div>
                <label className="text-white/40 text-xs font-bold uppercase mb-1.5 block">SIP (₹)</label>
                <input type="number" value={monthlyAmount} onChange={e => setMonthlyAmount(Number(e.target.value))} 
                   className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-emerald-500 outline-none" />
             </div>
             <div>
                <label className="text-white/40 text-xs font-bold uppercase mb-1.5 block">Current NAV</label>
                <input type="number" value={currentNAV} onChange={e => setCurrentNAV(Number(e.target.value))} 
                   className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-emerald-500 outline-none" 
                   placeholder="e.g. 52.4" />
             </div>
             <div>
                <label className="text-white/40 text-xs font-bold uppercase mb-1.5 block">52-Wk Peak NAV</label>
                <input type="number" value={peakNAV} onChange={e => setPeakNAV(Number(e.target.value))} 
                   className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-emerald-500 outline-none" 
                   placeholder="e.g. 60.1" />
             </div>
          </div>
          
          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
          
          <button onClick={handleCalculate} disabled={loading || !currentNAV || !peakNAV}
             className="w-full py-3 rounded-full text-black font-bold font-body bg-emerald-500 hover:bg-emerald-400 transition-colors disabled:opacity-50">
             {loading ? "Crunching..." : "Show Me The Math"}
          </button>
        </div>
      )}

      {result && (
        <div className="animate-in fade-in duration-500 space-y-6">
          {result.niftyContext.isMarketDown && (
            <div className="w-full liquid-glass rounded-xl px-6 py-4 border border-emerald-500/40 bg-emerald-500/5 flex flex-col md:flex-row items-center gap-3">
               <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shrink-0" />
               <p className="text-emerald-300 font-body font-medium text-center md:text-left text-sm leading-relaxed">
                 Nifty is approx <span className="font-bold">{result.niftyContext.drawdownFromPeak.toFixed(1)}%</span> below its peak — your SIP is accumulating units at a massive discount this month.
               </p>
            </div>
          )}

          <UnitAccumulationChart 
             monthlyAmount={monthlyAmount}
             bonusUnits={result.math.bonusUnits}
             normalUnitsAtPeak={result.math.normalUnitsAtPeak}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
             <div className="liquid-glass rounded-xl p-4 border border-white/5">
                <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">Extra Units</p>
                <p className="text-xl font-heading italic text-emerald-400">{result.math.bonusUnits.toFixed(2)}</p>
             </div>
             <div className="liquid-glass rounded-xl p-4 border border-white/5">
                <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">Bonus %</p>
                <p className="text-xl font-heading italic text-emerald-400">+{result.math.bonusUnitsPercent.toFixed(1)}%</p>
             </div>
             <div className="liquid-glass rounded-xl p-4 border border-red-500/20 bg-red-500/5">
                <p className="text-red-400/60 text-[10px] uppercase font-bold tracking-widest mb-1 leading-tight">Cost of missing 3 mo</p>
                <p className="text-xl font-heading italic text-red-400 drop-shadow-md">₹{result.math.opportunityCost.toLocaleString("en-IN")}</p>
             </div>
             <div className="liquid-glass rounded-xl p-4 border border-white/5">
                <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1 leading-tight">10-yr corpus</p>
                <p className="text-xl font-bold text-white">{formatINR(Math.round(result.math.projectedCorpus10yr))}</p>
             </div>
          </div>

          <div className="liquid-glass rounded-xl p-5 border border-emerald-500/10 bg-emerald-500/5">
             <div className="flex items-center gap-2 mb-3">
               <Brain className="w-5 h-5 text-emerald-400" />
               <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Behavioral Insight</span>
             </div>
             <p className="text-white text-base font-body font-medium mb-3">{result.insight.emotionalTrigger}</p>
             <div className="space-y-2">
                <p className="text-white/60 text-sm italic border-l-2 border-emerald-400/30 pl-3 py-0.5">{result.insight.historicalParallel}</p>
                <p className="text-white/60 text-sm">{result.insight.unitAccumulationInsight}</p>
                <p className="text-emerald-400/60 text-xs font-bold mt-2">— {result.insight.recoveryTimeline}</p>
             </div>
          </div>

          <div className="liquid-glass rounded-xl p-6 border border-emerald-500/30 flex flex-col items-center text-center mt-6">
             {!hasCommitted ? (
                <>
                  <p className="text-white text-xl font-heading italic mb-6 max-w-sm">"{result.insight.commitmentStatement}"</p>
                  <button onClick={commitToSIP} className="bg-emerald-500 hover:bg-emerald-400 transition-colors text-black font-bold text-base px-8 py-4 rounded-full shadow-lg shadow-emerald-500/20">
                     ✓ I Will Keep My SIP Running
                  </button>
                </>
             ) : (
                <div className="flex flex-col items-center animate-in zoom-in-50 duration-500">
                  <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                  <p className="font-heading italic text-2xl text-white mb-2">You've stayed invested through {streakCount} down period(s) 🔥</p>
                  <p className="text-white/50 text-sm mb-4">This decision compounds silently. Future you will remember this.</p>
                  <span className="liquid-glass-strong rounded-full px-4 py-2 text-emerald-400 font-body font-bold text-xs">
                     🔥 {streakCount}-month streak
                  </span>
                </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
