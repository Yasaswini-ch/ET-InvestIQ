export default function PatternStatsCard({
  latestClose,
  changePercent,
  trend,
  supportZones,
  resistanceZones,
  volumeSpike,
}: {
  latestClose: number;
  changePercent: number;
  trend: "bullish" | "neutral" | "bearish";
  supportZones: number[];
  resistanceZones: number[];
  volumeSpike: boolean;
}) {
  return (
    <div className="liquid-glass rounded-xl p-4">
      <h4 className="text-sm font-bold text-white mb-3">Pattern Context</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat label="Last Close" value={`Rs${latestClose.toFixed(2)}`} />
        <Stat
          label="Day Change"
          value={`${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`}
          tone={changePercent >= 0 ? "green" : "red"}
        />
        <Stat label="Trend" value={trend} tone={trend === "bullish" ? "green" : trend === "bearish" ? "red" : "amber"} />
        <Stat label="Support" value={supportZones.map((z) => `Rs${z.toFixed(0)}`).join(" / ")} />
        <Stat label="Resistance" value={resistanceZones.map((z) => `Rs${z.toFixed(0)}`).join(" / ")} />
        <Stat label="Volume Spike" value={volumeSpike ? "Yes" : "No"} tone={volumeSpike ? "amber" : "default"} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "green" | "red" | "amber";
}) {
  const toneClass =
    tone === "green"
      ? "text-emerald-400"
      : tone === "red"
      ? "text-red-400"
      : tone === "amber"
      ? "text-yellow-400"
      : "text-white";

  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-2">
      <p className="text-[10px] uppercase font-bold text-white/60">{label}</p>
      <p className={`text-sm font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}
