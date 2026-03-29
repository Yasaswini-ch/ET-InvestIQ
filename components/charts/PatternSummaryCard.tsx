import { ChartPatternInsight } from "@/lib/types/market";

export default function PatternSummaryCard({ pattern }: { pattern: ChartPatternInsight }) {
  const biasColor =
    pattern.bias === "bullish" ? "text-emerald-400" : pattern.bias === "bearish" ? "text-red-400" : "text-yellow-400";
  const formatRupees = (value?: number) =>
    typeof value === "number"
      ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value)
      : null;

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
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-white/5 border border-white/10 p-2">
          <p className="text-[10px] uppercase font-bold text-white/60">Invalidation</p>
          <p className="text-sm font-bold text-white">{formatRupees(pattern.invalidationLevel) ?? "n/a"}</p>
        </div>
        <div className="rounded-lg bg-white/5 border border-white/10 p-2">
          <p className="text-[10px] uppercase font-bold text-white/60">Reward / Risk</p>
          <p className="text-sm font-bold text-white">{typeof pattern.rewardToRisk === "number" ? `${pattern.rewardToRisk}:1` : "n/a"}</p>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-white/5 border border-white/10 p-2">
          <p className="text-[10px] uppercase font-bold text-white/60">Sample Size</p>
          <p className="text-sm font-bold text-white">{pattern.sampleSize ?? "n/a"}</p>
        </div>
        <div className="rounded-lg bg-white/5 border border-white/10 p-2">
          <p className="text-[10px] uppercase font-bold text-white/60">Avg Move</p>
          <p className="text-sm font-bold text-white">
            {typeof pattern.averageReturn === "number"
              ? `${pattern.averageReturn >= 0 ? "+" : ""}${pattern.averageReturn}%`
              : "n/a"}
          </p>
        </div>
      </div>
      <p className="text-[11px] mt-3 text-white/60">
        Risk: {pattern.riskNote}
      </p>
    </div>
  );
}
