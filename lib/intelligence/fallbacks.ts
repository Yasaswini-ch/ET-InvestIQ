import { BudgetAnnouncement, BudgetAnalysisResult, PromoterAnalysis, PromoterSignalRaw, StayCourseResult } from "@/lib/types/intelligence";

type PortfolioContext = Record<string, any> | null;

function asNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function estimateImpactValue(portfolioContext: PortfolioContext, pct: number): string {
  const base =
    asNumber(portfolioContext?.currentValue) ??
    asNumber(portfolioContext?.totalInvested) ??
    0;

  if (!base) {
    return `Potential impact: around ${pct.toFixed(1)}% of portfolio value`;
  }

  const low = Math.round(base * (pct / 100) * 0.6);
  const high = Math.round(base * (pct / 100) * 1.4);
  return `Approx. Rs. ${low.toLocaleString("en-IN")} to Rs. ${high.toLocaleString("en-IN")} impact`;
}

function matchedFunds(portfolioContext: PortfolioContext, keywords: string[]): string[] {
  const funds = [
    ...(Array.isArray(portfolioContext?.funds) ? portfolioContext.funds : []),
    ...(Array.isArray(portfolioContext?.topHoldings) ? portfolioContext.topHoldings : []),
  ];

  const names = funds
    .map((fund: any) => fund?.name || fund?.fundName || fund?.stock)
    .filter(Boolean)
    .map((name: string) => String(name));

  return names.filter((name) => {
    const lower = name.toLowerCase();
    return keywords.some((keyword) => lower.includes(keyword.toLowerCase()));
  }).slice(0, 4);
}

export function buildBudgetFallback(
  announcements: BudgetAnnouncement[],
  portfolioContext: PortfolioContext
): BudgetAnalysisResult {
  const items = announcements.map((announcement) => {
    const severityPct = announcement.severity === "high" ? 1.2 : announcement.severity === "medium" ? 0.5 : 0.2;
    const affectedFunds = matchedFunds(portfolioContext, [
      ...announcement.affectsAssetClasses,
      announcement.title,
      announcement.category,
    ]);

    const baseImpact =
      announcement.category === "taxation"
        ? "Review your tax efficiency and capital gains timing before the next rebalance."
        : announcement.category === "retirement"
          ? "This may improve long-term compounding if you lean into retirement-friendly plans."
          : "This changes the risk-reward profile for the funds or sectors you already hold.";

    const urgency: BudgetAnalysisResult["items"][number]["urgency"] =
      announcement.severity === "high"
        ? "act_now"
        : announcement.severity === "medium"
          ? "review_before_april"
          : "monitor";

    return {
      announcementId: announcement.id,
      announcementTitle: announcement.title,
      impactOnInvestor: baseImpact,
      rupeesImpact: estimateImpactValue(portfolioContext, severityPct),
      urgency,
      action:
        announcement.severity === "high"
          ? "Update your tax and allocation plan before the next deadline."
          : "Keep it on your watchlist and adjust on your next review date.",
      affectedFunds,
    };
  });

  const highCount = announcements.filter((a) => a.severity === "high").length;
  const mediumCount = announcements.filter((a) => a.severity === "medium").length;
  const overallImpact: BudgetAnalysisResult["overallImpact"] =
    highCount > mediumCount ? "negative" : announcements.length > 0 ? "neutral" : "neutral";

  return {
    overallImpact,
    impactSummary:
      announcements.length === 0
        ? "No announcements selected."
        : "These budget changes are most likely to affect tax efficiency, fund allocation, and when you should next rebalance your portfolio.",
    items,
    topAction:
      items.find((item) => item.urgency === "act_now")?.action ||
      items[0]?.action ||
      "Review the selected budget announcements against your current holdings.",
    deadline: items.some((item) => item.urgency === "act_now") ? "Before the next tax review date" : null,
  };
}

export function buildPromoterFallback(signals: PromoterSignalRaw[]): PromoterAnalysis {
  const enriched = signals.map((signal, index) => {
    const positive = signal.changeType === "buy";
    const convictionScore = Math.min(
      96,
      Math.max(35, Math.round((positive ? 68 : 60) + Math.abs(signal.percentageChange) * 12 - index * 2))
    );
    const retailSignal: PromoterAnalysis["signals"][number]["retailSignal"] =
      positive && signal.percentageChange >= 1
        ? "strong_buy_signal"
        : positive
          ? "watch"
          : signal.percentageChange >= 1
            ? "sell_signal"
            : "noise";

    return {
      company: signal.company,
      ticker: signal.company.replace(/\s+Ltd\.?$/i, "").slice(0, 6).toUpperCase(),
      changeType: signal.changeType,
      percentageChange: signal.percentageChange,
      date: signal.date,
      convictionScore,
      convictionReason: positive
        ? "Promoter accumulation usually signals confidence when the stake change is meaningful."
        : "Promoter selling can matter when the change is material or repeated.",
      historicalContext: positive
        ? "Promoter buying like this has often preceded stronger business conviction."
        : "Promoter exits often warrant extra caution around valuation and execution risk.",
      retailSignal,
      riskFactors: positive
        ? ["Track whether the business follows through with earnings growth.", "Check if the buying is part of a broader promoter pattern."]
        : ["Confirm whether the sale is for liquidity or a larger confidence signal.", "Compare with recent quarter results and pledge changes."],
      relatedSector: /finance|bank|lending/i.test(signal.company)
        ? "Financials"
        : /tech|software|infosys|tcs/i.test(signal.company)
          ? "IT"
          : /auto|motors/i.test(signal.company)
            ? "Automobiles"
            : /energy|power|green/i.test(signal.company)
              ? "Energy"
              : "Diversified",
    };
  });

  const buyCount = signals.filter((signal) => signal.changeType === "buy").length;
  const sellCount = signals.length - buyCount;

  return {
    signals: enriched,
    marketTheme:
      buyCount > sellCount
        ? "Promoter accumulation is broader than distribution, which usually reads as a constructive signal."
        : sellCount > buyCount
          ? "Promoter selling is dominating, so the market is treating these names with more caution."
          : "Promoter activity is mixed, so stock-specific context matters more than a broad theme.",
    smartMoneyMood: buyCount > sellCount ? "accumulating" : sellCount > buyCount ? "distributing" : "mixed",
    topSignal: (() => {
      const top = enriched.slice().sort((a, b) => b.percentageChange - a.percentageChange)[0];
      return top
        ? `${top.company} shows the strongest move in this batch.`
        : "No promoter signal stood out strongly enough to dominate the batch.";
    })(),
  };
}

export function buildStayCourseFallback(
  math: StayCourseResult["math"],
  drawdownPercent: number
): StayCourseResult {
  const down = drawdownPercent > 5;
  return {
    math,
    insight: {
      emotionalTrigger: down
        ? "The market is offering units at a discount, not asking you to stop compounding."
        : "Staying consistent matters more than reacting to short-term noise.",
      historicalParallel: "Investors who stayed invested through temporary drawdowns usually recovered faster than those who paused SIPs.",
      unitAccumulationInsight: down
        ? "You are buying more units for the same SIP amount, which improves your long-term unit cost."
        : "Even in flat markets, disciplined investing keeps your compounding engine running.",
      recoveryTimeline: "Historically, Indian markets have recovered in cycles, but the exact timeline varies by sector and macro backdrop.",
      commitmentStatement: "I will let my SIP work through the dip instead of interrupting compounding.",
    },
    niftyContext: {
      isMarketDown: down,
      drawdownFromPeak: Math.max(0, drawdownPercent),
    },
  };
}
