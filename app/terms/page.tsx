import PageHeader from "@/components/PageHeader";

export default function TermsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Terms of Use" description="How ET InvestIQ should and should not be used." />
      <div className="liquid-glass rounded-2xl border border-white/10 p-6 space-y-4 text-sm text-white/70">
        <p>ET InvestIQ is provided for educational and informational use only. It does not provide SEBI-registered investment advice, portfolio management, or execution services.</p>
        <p>You should independently verify any market, scam, chart, or portfolio insight before acting on it. AI-generated outputs can be incomplete, delayed, or imperfect.</p>
        <p>You are responsible for any investment decisions you make after using the platform. No guarantee of returns, accuracy, or uninterrupted data availability is provided.</p>
        <p>By using the app, you agree not to rely on it as a sole basis for trading, investing, or legal interpretation.</p>
      </div>
    </div>
  );
}
