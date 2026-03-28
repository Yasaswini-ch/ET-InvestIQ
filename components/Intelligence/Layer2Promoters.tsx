"use client";

import { useEffect, useState } from "react";
import PromoterSignalCard from "./PromoterSignalCard";
import { PromoterAnalysis } from "@/lib/types/intelligence";
import { Star } from "lucide-react";

interface Props {
  isExpanded: boolean;
  portfolioContext: any | null;
}

export default function Layer2Promoters({ isExpanded, portfolioContext }: Props) {
  const [data, setData] = useState<PromoterAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const FETCH_TIMEOUT_MS = 14000;

  useEffect(() => {
    if (isExpanded && !data && !loading) {
       fetchData();
    }
  }, [isExpanded, data, loading]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch("/api/intelligence/promoters", { signal: controller.signal });
      if (!res.ok) throw new Error("Failed to load smart money signals");
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e?.name === "AbortError"
        ? "Promoter feed request timed out. Retry to refresh the smart money layer."
        : "Unable to sync BSE promoter feeds at the moment. Showing fallback intel.");
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  const getMatchedFund = (ticker: string, company: string) => {
    if (!portfolioContext) return null;
    const lowerTicker = ticker?.toLowerCase() || "";
    const lowerCompany = company?.toLowerCase() || "";
    
    if (portfolioContext.topHoldings && Array.isArray(portfolioContext.topHoldings)) {
      for (const h of portfolioContext.topHoldings) {
         if (h && h.stock) {
            const hLower = h.stock.toLowerCase();
            if (hLower.includes(lowerTicker.replace(".ns", "")) || hLower.includes(lowerCompany)) {
               return "your core holdings";
            }
         }
      }
    }
    return null;
  };

  if (error && !data) {
    return (
      <div className="text-red-400 p-4 border border-red-500/20 bg-red-500/5 rounded-xl text-sm flex items-center gap-2">
        <span>!</span> {error}
        <button onClick={fetchData} className="ml-auto text-xs underline text-red-300 hover:text-white">Retry</button>
      </div>
    );
  }

  if (loading || (!data && isExpanded)) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1,2,3].map(i => (
           <div key={i} className="liquid-glass rounded-xl p-5 h-64 animate-pulse border border-white/5 bg-white/5" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left liquid-glass p-4 rounded-xl border border-white/5 bg-white/[0.01]">
          <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider shrink-0 ${
             data.smartMoneyMood === 'accumulating' ? 'bg-emerald-500/20 text-emerald-400' :
             data.smartMoneyMood === 'distributing' ? 'bg-red-500/20 text-red-400' :
             'bg-yellow-500/20 text-yellow-400'
          }`}>
             Smart Money {data.smartMoneyMood}
          </span>
          <p className="text-white/80 text-sm font-medium leading-relaxed font-body">
            {data.marketTheme}
          </p>
       </div>

       <div className="liquid-glass rounded-xl px-5 py-4 border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
          <Star className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-white text-sm font-body leading-relaxed">
             {data.topSignal}
          </p>
       </div>

       {portfolioContext && (
         <div className="liquid-glass rounded-xl px-4 py-3 border border-amber-500/10 bg-amber-500/5 mt-4">
            <p className="text-amber-400/80 text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
               <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
               Checking against your portfolio holdings...
            </p>
            <div className="space-y-1">
               {data.signals.map((signal) => {
                 const fundMatch = getMatchedFund(signal.ticker, signal.company);
                 if (fundMatch) {
                    return <p key={signal.ticker} className="text-amber-300 text-xs">You have exposure to <span className="font-bold text-white">{signal.company}</span> via {fundMatch}</p>;
                 }
                 return null;
               })}
            </div>
         </div>
       )}

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.signals.map((signal, i) => (
             <PromoterSignalCard key={i} signal={signal} />
          ))}
       </div>
    </div>
  );
}
