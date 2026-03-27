import { ChartPatternInsight } from "@/lib/types/market";

export default function PatternSummaryCard({ pattern }: { pattern: ChartPatternInsight }) {
  const biasColor =
    pattern.bias === "bullish" ? "text-emerald-400" : pattern.bias === "bearish" ? "text-red-400" : "text-yellow-400";

  return (
    <div className="liquid-glass rounded-xl p-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h4 className="text-sm font-bold text-white">{pattern.name}</h4>
        <span className={`text-xs font-bold uppercase ${biasColor}`}>{pattern.bias}</span>
      </div>
      <p className="text-xs text-white/80 leading-relaxed">{pattern.explanation}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-white/5 border border-white/10 p-2">
          <p className="text-[10px] uppercase font-bold text-white/60">Confidence</p>
          <p className="text-sm font-bold text-white">{pattern.confidence}%</p>
        </div>
        <div className="rounded-lg bg-white/5 border border-white/10 p-2">
          <p className="text-[10px] uppercase font-bold text-white/60">AI Success Rate</p>
          <p className="text-sm font-bold text-white">{pattern.successRate}%</p>
        </div>
      </div>
      <p className="text-[11px] mt-3 text-white/60">
        Risk: {pattern.riskNote}
      </p>
    </div>
  );
}
