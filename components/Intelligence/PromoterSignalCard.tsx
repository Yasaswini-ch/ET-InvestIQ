"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PromoterSignalEnriched } from "@/lib/types/intelligence";

interface Props {
  signal: PromoterSignalEnriched;
}

export default function PromoterSignalCard({ signal }: Props) {
  const [showRisks, setShowRisks] = useState(false);

  return (
    <div className="liquid-glass rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between h-full bg-white/[0.01]">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-body font-medium">{signal.company}</span>
              <span className="liquid-glass-strong rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[10px] text-white/50 tracking-widen uppercase">
                {signal.ticker}
              </span>
            </div>
            <span className="text-white/40 text-[10px]">{new Date(signal.date).toLocaleDateString('en-IN')}</span>
          </div>

          <div
            className={`px-2 py-1 rounded-lg text-xs font-bold shrink-0 ${
              signal.changeType === "buy" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
            }`}
          >
            {signal.changeType === "buy" ? "▲ Promoter Buying" : "▼ Promoter Selling"}
          </div>
        </div>

        <div className="mb-4">
          <span className="text-3xl font-heading italic text-white flex items-end gap-1">
            {signal.percentageChange}%<span className="text-sm text-white/40 font-body not-italic mb-1 font-bold">stake change</span>
          </span>
        </div>

        <div className="mb-4">
          <div className="flex justify-between mb-1.5">
             <span className="text-xs text-white/50 font-medium">Conviction</span>
             <span className="text-xs text-white/80 font-bold">{signal.convictionScore}/100</span>
          </div>
          <div className="liquid-glass rounded-full h-1.5 w-full bg-white/10 overflow-hidden relative">
             <div 
               className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${signal.convictionScore > 70 ? 'bg-emerald-400' : signal.convictionScore >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`} 
               style={{ width: `${signal.convictionScore}%` }}
             />
          </div>
          <p className="text-white/60 text-xs mt-2 leading-relaxed">{signal.convictionReason}</p>
        </div>

        <div className="mb-4">
          <p className="text-white/40 text-xs italic leading-relaxed">
            {signal.historicalContext}
          </p>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`liquid-glass rounded-full px-2 py-1 text-[10px] font-bold ${
             signal.retailSignal === 'strong_buy_signal' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
             signal.retailSignal === 'sell_signal' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
             signal.retailSignal === 'watch' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
             'bg-white/5 text-white/30 border border-white/10'
          }`}>
             {signal.retailSignal === 'strong_buy_signal' ? 'Strong Signal for Retail' :
              signal.retailSignal === 'sell_signal' ? 'Possible Distribution' :
              signal.retailSignal === 'watch' ? 'Worth Watching' : 'Likely Noise'}
          </span>
          <span className="liquid-glass rounded-full px-2 py-1 text-[10px] text-white/50 border border-white/5 uppercase">
            {signal.relatedSector}
          </span>
        </div>

        {signal.riskFactors && signal.riskFactors.length > 0 && (
          <div className="border-t border-white/5 pt-3 mt-1">
             <button 
                onClick={() => setShowRisks(!showRisks)}
                className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white transition-colors uppercase font-bold tracking-widest"
             >
                {showRisks ? 'Hide Risks' : 'View Risks'}
                {showRisks ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
             </button>
             
             {showRisks && (
                <div className="mt-2 space-y-1">
                   {signal.riskFactors.map((risk: string, i: number) => (
                      <p key={i} className="text-red-400/70 text-xs flex items-start gap-1">
                         <span className="text-[8px] mt-1">•</span> {risk}
                      </p>
                   ))}
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
