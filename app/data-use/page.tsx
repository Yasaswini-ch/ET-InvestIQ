import PageHeader from "@/components/PageHeader";

export default function DataUsePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="How We Use Your Data" description="A plain-English overview of what ET InvestIQ reads, stores, and personalizes." />
      <div className="liquid-glass rounded-2xl border border-white/10 p-6 space-y-5 text-sm text-white/70">
        <section className="space-y-2">
          <h2 className="text-base font-medium text-white">Portfolio and CAS data</h2>
          <p>CAS uploads are used to generate X-Ray analysis and related portfolio-aware features such as Briefing, Radar overlap mapping, SIP personalization, and portfolio-aware chat.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-medium text-white">Browser storage</h2>
          <p>The app currently stores selected user context locally in your browser, including watchlist items, recent chat sessions, shortcut hints, and portfolio context snapshots.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-medium text-white">Live market and regulatory feeds</h2>
          <p>We fetch market and feed data from available providers such as Yahoo Finance, BSE, NSE, and SEBI-linked sources. These feeds can be delayed or unavailable, so the app falls back gracefully when needed.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-medium text-white">AI processing</h2>
          <p>User prompts, selected market context, and portfolio context may be used to generate AI outputs. Those outputs are for informational support and should be verified before action.</p>
        </section>
      </div>
    </div>
  );
}
