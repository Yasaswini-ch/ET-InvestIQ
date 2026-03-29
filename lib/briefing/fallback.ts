type PortfolioContext = Record<string, any> | null;

function formatCurrency(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "your portfolio";
  return `Rs. ${Math.round(n).toLocaleString("en-IN")}`;
}

export function buildBriefingFallback(portfolioContext: PortfolioContext) {
  const hasPortfolio = Boolean(portfolioContext);
  const investorName = String(portfolioContext?.investorName || "Investor");
  const portfolioValue = formatCurrency(portfolioContext?.currentValue);
  const healthScore = Number(portfolioContext?.portfolioHealthScore ?? 0);

  const alerts = hasPortfolio
    ? [
        {
          id: "briefing_portfolio_1",
          severity: "high" as const,
          category: "portfolio" as const,
          title: "Review concentration risk",
          detail: `Your portfolio is currently centered around ${portfolioValue}. A quick concentration check helps reduce single-theme risk and improves resilience.`,
          action: "Review your top holdings and ensure no single fund or theme dominates returns.",
          linkedFeature: "/xray" as const,
          linkedLabel: "Open X-Ray",
        },
        {
          id: "briefing_market_1",
          severity: "medium" as const,
          category: "market" as const,
          title: "Track market leadership",
          detail: "Broad market leadership often rotates quickly. Watching sector strength helps you avoid chasing yesterday’s winners.",
          action: "Check today’s market movers before making any allocation changes.",
          linkedFeature: "/radar" as const,
          linkedLabel: "Open Radar",
        },
        {
          id: "briefing_action_1",
          severity: "low" as const,
          category: "action" as const,
          title: "Keep your SIP steady",
          detail: `Your portfolio health score is ${healthScore}/100, which means consistency matters more than reacting to short-term noise.`,
          action: "Keep your SIP running unless your goals or risk profile have changed.",
          linkedFeature: "/sip" as const,
          linkedLabel: "Open SIP Tools",
        },
      ]
    : [
        {
          id: "briefing_market_1",
          severity: "medium" as const,
          category: "market" as const,
          title: "Focus on portfolio basics",
          detail: "Start with diversification, long-term allocation, and a clear investment goal before reacting to market headlines.",
          action: "Run Portfolio X-Ray to get a personalized briefing.",
          linkedFeature: "/xray" as const,
          linkedLabel: "Open X-Ray",
        },
        {
          id: "briefing_opportunity_1",
          severity: "low" as const,
          category: "opportunity" as const,
          title: "Watch quality entries",
          detail: "A disciplined entry plan and regular SIPs usually matter more than trying to predict every short-term move.",
          action: "Review a shortlist of quality funds or stocks before investing.",
          linkedFeature: "/charts" as const,
          linkedLabel: "Open Charts",
        },
      ];

  return {
    generatedAt: new Date().toISOString(),
    fallbackUsed: true,
    investorName,
    marketMood: hasPortfolio ? "Measured and Selective" : "Balanced and Observant",
    headline: hasPortfolio
      ? "Your portfolio briefing focuses on risk control, consistency, and the next best action."
      : "A clean starting point for market context and disciplined investing.",
    alerts,
    topOpportunity: hasPortfolio
      ? "Your next opportunity is to reduce overlap and align the portfolio with the risk you actually want to take."
      : "Build a simple, diversified base first and let the market work for you over time.",
    urgentAction: hasPortfolio
      ? "Review your top holdings and confirm your SIPs still match your goals."
      : "Run X-Ray to personalize the briefing to your holdings.",
  };
}
