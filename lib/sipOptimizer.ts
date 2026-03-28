export type SipRiskAppetite = "conservative" | "moderate" | "aggressive";

export interface SipPortfolioContext {
  totalInvested?: number;
  currentValue?: number;
}

export interface SipOptimizerInput {
  monthlyAmount: number;
  goalName: string;
  timelineYears: number;
  riskAppetite: SipRiskAppetite;
  currentCorpus: number;
  portfolioContext: SipPortfolioContext | null;
}

export interface SipProjection {
  totalCorpus: number;
  totalInvested: number;
  wealthGained: number;
}

export interface SipYearPoint {
  year: number;
  conservative: number;
  moderate: number;
  aggressive: number;
}

export interface SipAllocationPlanItem {
  category: string;
  percentage: number;
  monthlyAmount: number;
  rationale: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  expectedReturn: string;
  taxBenefit: boolean;
}

export interface SipGapAnalysis {
  currentProjectedCorpus: number;
  targetCorpus: number;
  gap: number;
  isOnTrack: boolean;
  monthlyIncreaseNeeded: number;
}

export interface SipOptimizerResponse {
  goal: {
    name: string;
    monthlyAmount: number;
    timelineYears: number;
    riskAppetite: SipRiskAppetite;
    currentCorpus: number;
  };
  projections: {
    conservative: SipProjection;
    moderate: SipProjection;
    aggressive: SipProjection;
  };
  yearlyData: SipYearPoint[];
  allocationPlan: SipAllocationPlanItem[];
  planSummary: string;
  topPriority: string;
  rebalanceFrequency: string;
  emergencyFundAdvice: string;
  taxNote: string;
  bestCaseNote: string;
  worstCaseNote: string;
  sipStartAdvice: string;
  gapAnalysis: SipGapAnalysis | null;
  generatedAt: string;
}

const RATE_BY_RISK: Record<SipRiskAppetite, number> = {
  conservative: 0.08,
  moderate: 0.11,
  aggressive: 0.14,
};

const FALLBACK_ALLOCATION_PLANS: Record<SipRiskAppetite, Omit<SipAllocationPlanItem, "monthlyAmount">[]> = {
  conservative: [
    {
      category: "Debt / Liquid",
      percentage: 45,
      rationale: "Helps stabilise the portfolio and preserves capital for near-term goals.",
      riskLevel: "LOW",
      expectedReturn: "6-8%",
      taxBenefit: false,
    },
    {
      category: "Large Cap Equity",
      percentage: 30,
      rationale: "Provides core equity growth with lower volatility than smaller companies.",
      riskLevel: "MEDIUM",
      expectedReturn: "10-12%",
      taxBenefit: false,
    },
    {
      category: "Hybrid / Balanced",
      percentage: 15,
      rationale: "Adds a blend of equity and debt to smooth the journey.",
      riskLevel: "MEDIUM",
      expectedReturn: "9-10%",
      taxBenefit: false,
    },
    {
      category: "Gold",
      percentage: 10,
      rationale: "Acts as a portfolio shock absorber during stress periods.",
      riskLevel: "LOW",
      expectedReturn: "6-8%",
      taxBenefit: false,
    },
  ],
  moderate: [
    {
      category: "Large Cap Equity",
      percentage: 35,
      rationale: "A dependable anchor for long-term compounding.",
      riskLevel: "MEDIUM",
      expectedReturn: "10-12%",
      taxBenefit: false,
    },
    {
      category: "Flexi Cap",
      percentage: 25,
      rationale: "Lets the manager shift between large and mid caps as opportunities change.",
      riskLevel: "MEDIUM",
      expectedReturn: "11-13%",
      taxBenefit: false,
    },
    {
      category: "Mid Cap Equity",
      percentage: 15,
      rationale: "Adds growth potential without taking on an aggressive posture.",
      riskLevel: "HIGH",
      expectedReturn: "12-14%",
      taxBenefit: false,
    },
    {
      category: "Debt / Liquid",
      percentage: 15,
      rationale: "Keeps a part of the money ready for rebalancing and emergencies.",
      riskLevel: "LOW",
      expectedReturn: "6-8%",
      taxBenefit: false,
    },
    {
      category: "Gold",
      percentage: 10,
      rationale: "Adds a hedge against market stress and currency risk.",
      riskLevel: "LOW",
      expectedReturn: "6-8%",
      taxBenefit: false,
    },
  ],
  aggressive: [
    {
      category: "Flexi Cap",
      percentage: 30,
      rationale: "Keeps the portfolio dynamic while staying invested in equity.",
      riskLevel: "HIGH",
      expectedReturn: "11-14%",
      taxBenefit: false,
    },
    {
      category: "Mid Cap Equity",
      percentage: 25,
      rationale: "Targets faster growth in exchange for higher volatility.",
      riskLevel: "HIGH",
      expectedReturn: "12-15%",
      taxBenefit: false,
    },
    {
      category: "Small Cap Equity",
      percentage: 20,
      rationale: "Maximises growth optionality but requires a strong risk appetite.",
      riskLevel: "HIGH",
      expectedReturn: "13-16%",
      taxBenefit: false,
    },
    {
      category: "Large Cap Equity",
      percentage: 15,
      rationale: "Prevents the portfolio from becoming too aggressive in one direction.",
      riskLevel: "MEDIUM",
      expectedReturn: "10-12%",
      taxBenefit: false,
    },
    {
      category: "International Equity",
      percentage: 10,
      rationale: "Adds diversification across geographies and currency exposure.",
      riskLevel: "HIGH",
      expectedReturn: "11-14%",
      taxBenefit: false,
    },
  ],
};

function annualRateForRisk(riskAppetite: SipRiskAppetite): number {
  return RATE_BY_RISK[riskAppetite];
}

function projectionFor(monthlyAmount: number, currentCorpus: number, annualRate: number, years: number): SipProjection {
  const n = years * 12;
  const r = annualRate / 12;
  const futureValueSIP = monthlyAmount * (((1 + r) ** n - 1) / r) * (1 + r);
  const futureValueCorpus = currentCorpus * (1 + annualRate) ** years;
  const totalCorpus = futureValueSIP + futureValueCorpus;
  const totalInvested = monthlyAmount * n + currentCorpus;
  return {
    totalCorpus,
    totalInvested,
    wealthGained: totalCorpus - totalInvested,
  };
}

export function buildSipProjections(monthlyAmount: number, currentCorpus: number, timelineYears: number) {
  return {
    conservative: projectionFor(monthlyAmount, currentCorpus, RATE_BY_RISK.conservative, timelineYears),
    moderate: projectionFor(monthlyAmount, currentCorpus, RATE_BY_RISK.moderate, timelineYears),
    aggressive: projectionFor(monthlyAmount, currentCorpus, RATE_BY_RISK.aggressive, timelineYears),
  };
}

export function buildSipYearlyData(monthlyAmount: number, currentCorpus: number, timelineYears: number): SipYearPoint[] {
  const points: SipYearPoint[] = [];
  for (let year = 0; year <= timelineYears; year += 1) {
    points.push({
      year,
      conservative: projectionFor(monthlyAmount, currentCorpus, RATE_BY_RISK.conservative, year).totalCorpus,
      moderate: projectionFor(monthlyAmount, currentCorpus, RATE_BY_RISK.moderate, year).totalCorpus,
      aggressive: projectionFor(monthlyAmount, currentCorpus, RATE_BY_RISK.aggressive, year).totalCorpus,
    });
  }
  return points;
}

export function buildSipGapAnalysis({
  portfolioContext,
  moderateProjection,
  timelineYears,
}: {
  portfolioContext: SipPortfolioContext | null;
  moderateProjection: SipProjection;
  timelineYears: number;
}): SipGapAnalysis | null {
  const investedBase = Number(portfolioContext?.totalInvested ?? 0);
  if (!Number.isFinite(investedBase) || investedBase <= 0) return null;

  const currentMonthlyEstimate = investedBase / 60;
  const currentProjectedCorpus = projectionFor(currentMonthlyEstimate, investedBase, RATE_BY_RISK.moderate, timelineYears).totalCorpus;
  const targetCorpus = moderateProjection.totalCorpus;
  const gap = targetCorpus - currentProjectedCorpus;
  const annualRate = RATE_BY_RISK.moderate;
  const n = timelineYears * 12;
  const r = annualRate / 12;
  const sipFactor = (((1 + r) ** n - 1) / r) * (1 + r);

  return {
    currentProjectedCorpus,
    targetCorpus,
    gap,
    isOnTrack: gap <= 0,
    monthlyIncreaseNeeded: gap > 0 ? gap / sipFactor : 0,
  };
}

export function buildFallbackAllocationPlan(riskAppetite: SipRiskAppetite, monthlyAmount: number): SipAllocationPlanItem[] {
  return FALLBACK_ALLOCATION_PLANS[riskAppetite].map((item) => ({
    ...item,
    monthlyAmount: Math.round((monthlyAmount * item.percentage) / 100),
  }));
}

export function buildSipOptimizerFallback(input: SipOptimizerInput): SipOptimizerResponse {
  const monthlyAmount = Number.isFinite(input.monthlyAmount) ? Math.max(0, input.monthlyAmount) : 0;
  const currentCorpus = Number.isFinite(input.currentCorpus) ? Math.max(0, input.currentCorpus) : 0;
  const timelineYears = Math.max(1, Math.min(30, Math.round(input.timelineYears || 1)));
  const riskAppetite = input.riskAppetite;
  const projections = buildSipProjections(monthlyAmount, currentCorpus, timelineYears);
  const yearlyData = buildSipYearlyData(monthlyAmount, currentCorpus, timelineYears);
  const allocationPlan = buildFallbackAllocationPlan(riskAppetite, monthlyAmount);
  const gapAnalysis = input.portfolioContext ? buildSipGapAnalysis({
    portfolioContext: input.portfolioContext,
    moderateProjection: projections.moderate,
    timelineYears,
  }) : null;

  const summaryByRisk: Record<SipRiskAppetite, string> = {
    conservative: "This plan prioritises stability and capital preservation while keeping enough equity exposure for real compounding.",
    moderate: "This plan balances growth and volatility so you can stay invested through normal market cycles.",
    aggressive: "This plan leans into equity growth and assumes you can tolerate deep drawdowns without abandoning the SIP.",
  };

  return {
    goal: {
      name: input.goalName || "Financial Goal",
      monthlyAmount,
      timelineYears,
      riskAppetite,
      currentCorpus,
    },
    projections,
    yearlyData,
    allocationPlan,
    planSummary: summaryByRisk[riskAppetite],
    topPriority: gapAnalysis?.isOnTrack
      ? "Keep the SIP running and automate contributions."
      : "Increase monthly contribution or extend the timeline to close the gap.",
    rebalanceFrequency: riskAppetite === "aggressive" ? "Every 6 months" : "Every 12 months",
    emergencyFundAdvice: "Keep 6 months of expenses in cash or liquid funds before taking on more equity risk.",
    taxNote: "Prefer tax-efficient instruments where appropriate, and review capital gains rules before major redemptions.",
    bestCaseNote: "If markets stay strong, the aggressive path compounds the fastest and can create a noticeably larger corpus.",
    worstCaseNote: "If markets stay choppy, your journey will feel easier with the conservative or moderate path.",
    sipStartAdvice: "Start on the next salary date and automate the transfer so discipline does not depend on motivation.",
    gapAnalysis,
    generatedAt: new Date().toISOString(),
  };
}

export function annualRateFromRisk(riskAppetite: SipRiskAppetite): number {
  return annualRateForRisk(riskAppetite);
}
