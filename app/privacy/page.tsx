import PageHeader from "@/components/PageHeader";

export default function PrivacyPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Privacy Policy" description="Plain-English summary of how ET InvestIQ handles your information." />
      <div className="liquid-glass rounded-2xl border border-white/10 p-6 space-y-4 text-sm text-white/70">
        <p>ET InvestIQ uses portfolio uploads and investor inputs to generate analysis inside the app experience. We do not present this as custodial or advisory account management.</p>
        <p>Uploaded CAS content is used only to generate portfolio analysis and connected product context. Local browser storage is used for watchlists, chat history, shortcut hints, and recent portfolio context.</p>
        <p>Live market requests may call third-party market-data providers and exchange or regulatory feeds. Those providers may maintain their own logs and rate limits.</p>
        <p>If you want portfolio-related context removed from your browser, clear local storage or use the relevant delete options as they become available in-product.</p>
        <p>This page is a lightweight policy summary for hackathon and demo usage. Do not treat it as a substitute for a lawyer-reviewed production privacy policy.</p>
      </div>
    </div>
  );
}
