import PageHeader from "@/components/PageHeader";

const statuses = [
  ["Portfolio X-Ray", "Operational"],
  ["Opportunity Radar", "Operational with fallback support"],
  ["Chart Pattern Intelligence", "Operational with fallback support"],
  ["Scam Shield", "Operational"],
  ["Watchlist Signals", "Operational with delayed-feed fallback"],
  ["AI Video Engine", "Operational with browser-native export"],
] as const;

export default function StatusPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Status" description="Quick view of product readiness and fallback posture." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {statuses.map(([name, state]) => (
          <div key={name} className="liquid-glass rounded-2xl border border-white/10 p-5">
            <p className="text-sm font-medium text-white">{name}</p>
            <p className="mt-2 text-sm text-emerald-300">{state}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/65">
        This lightweight status page is intended for demo and operational transparency. For data issues or bugs, please use the Report an issue link in the footer.
      </div>
    </div>
  );
}
