import { NextRequest, NextResponse } from "next/server";
import { generateStructuredJSON } from "@/lib/gemini";
import { rateLimit, getIP } from "@/lib/rateLimit";
import {
  SipOptimizerInput,
  SipOptimizerResponse,
  buildSipGapAnalysis,
  buildSipOptimizerFallback,
  buildSipProjections,
  buildSipYearlyData,
  SipRiskAppetite,
} from "@/lib/sipOptimizer";

const SYSTEM = "You are a SEBI-aware Indian financial planning AI. Create specific SIP allocation plans using fund categories only, not specific fund names. Return ONLY valid JSON.";

function isRiskAppetite(value: unknown): value is SipRiskAppetite {
  return value === "conservative" || value === "moderate" || value === "aggressive";
}

function clampYears(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.min(30, Math.max(1, Math.round(n)));
}

function clampAmount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function normalizeAllocationPlan(plan: unknown, monthlyAmount: number, fallbackRisk: SipRiskAppetite) {
  if (!Array.isArray(plan) || plan.length === 0) {
    return buildSipOptimizerFallback({
      monthlyAmount,
      goalName: "Financial Goal",
      timelineYears: 1,
      riskAppetite: fallbackRisk,
      currentCorpus: 0,
      portfolioContext: null,
    }).allocationPlan;
  }

  const cleaned = plan
    .map((item) => ({
      category: String((item as { category?: unknown }).category || "").trim() || "Equity",
      percentage: Math.max(0, Number((item as { percentage?: unknown }).percentage) || 0),
      monthlyAmount: Math.max(0, Number((item as { monthlyAmount?: unknown }).monthlyAmount) || 0),
      rationale: String((item as { rationale?: unknown }).rationale || ""),
      riskLevel: (String((item as { riskLevel?: unknown }).riskLevel || "MEDIUM").toUpperCase() as "LOW" | "MEDIUM" | "HIGH"),
      expectedReturn: String((item as { expectedReturn?: unknown }).expectedReturn || ""),
      taxBenefit: Boolean((item as { taxBenefit?: unknown }).taxBenefit),
    }))
    .filter((item) => item.category);

  const total = cleaned.reduce((sum, item) => sum + item.percentage, 0);
  if (total <= 0) {
    return buildSipOptimizerFallback({
      monthlyAmount,
      goalName: "Financial Goal",
      timelineYears: 1,
      riskAppetite: fallbackRisk,
      currentCorpus: 0,
      portfolioContext: null,
    }).allocationPlan;
  }

  const normalized = cleaned.map((item, index) => {
    const pct = index === cleaned.length - 1 ? 100 - cleaned.slice(0, -1).reduce((sum, row) => sum + row.percentage, 0) : Math.round((item.percentage / total) * 100);
    return {
      ...item,
      percentage: pct,
      monthlyAmount: Math.round((monthlyAmount * pct) / 100),
    };
  });

  return normalized;
}

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  if (!rateLimit(ip, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let payload: Partial<SipOptimizerInput> = {};
  try {
    payload = (await req.json()) as Partial<SipOptimizerInput>;
  } catch {
    payload = {};
  }

  const monthlyAmount = clampAmount(payload.monthlyAmount);
  const goalName = String(payload.goalName || "Financial Goal");
  const timelineYears = clampYears(payload.timelineYears);
  const riskAppetite = isRiskAppetite(payload.riskAppetite) ? payload.riskAppetite : "moderate";
  const currentCorpus = clampAmount(payload.currentCorpus);
  const portfolioContext = payload.portfolioContext ?? null;

  const projections = buildSipProjections(monthlyAmount, currentCorpus, timelineYears);
  const yearlyData = buildSipYearlyData(monthlyAmount, currentCorpus, timelineYears);
  const gapAnalysis = portfolioContext ? buildSipGapAnalysis({
    portfolioContext,
    moderateProjection: projections.moderate,
    timelineYears,
  }) : null;

  const userPrompt = `Goal: ${goalName}
Monthly SIP: Rs. ${monthlyAmount.toLocaleString("en-IN")}
Timeline: ${timelineYears} years
Risk: ${riskAppetite}
Current corpus: Rs. ${currentCorpus.toLocaleString("en-IN")}

Return:
{
  "allocationPlan": [
    {
      "category": string,
      "percentage": number,
      "monthlyAmount": number,
      "rationale": string,
      "riskLevel": "LOW" | "MEDIUM" | "HIGH",
      "expectedReturn": string,
      "taxBenefit": boolean
    }
  ],
  "planSummary": string,
  "topPriority": string,
  "rebalanceFrequency": string,
  "emergencyFundAdvice": string,
  "taxNote": string,
  "bestCaseNote": string,
  "worstCaseNote": string,
  "sipStartAdvice": string
}

All percentages must sum to 100.
Conservative: 40-50% debt, 25-35% large cap, 15-20% hybrid, 5-10% gold.
Moderate: 30-40% large cap, 20-30% flexi cap, 10-20% mid cap, 10-20% debt, 5% gold.
Aggressive: 25-35% flexi cap, 20-30% mid cap, 15-25% small cap, 10-20% large cap, 5-10% international.`;

  try {
    const ai = await generateStructuredJSON<{
      allocationPlan: SipOptimizerResponse["allocationPlan"];
      planSummary: string;
      topPriority: string;
      rebalanceFrequency: string;
      emergencyFundAdvice: string;
      taxNote: string;
      bestCaseNote: string;
      worstCaseNote: string;
      sipStartAdvice: string;
    }>(userPrompt, SYSTEM);

    const fallback = buildSipOptimizerFallback({
      monthlyAmount,
      goalName,
      timelineYears,
      riskAppetite,
      currentCorpus,
      portfolioContext,
    });

    const response: SipOptimizerResponse = {
      goal: {
        name: goalName,
        monthlyAmount,
        timelineYears,
        riskAppetite,
        currentCorpus,
      },
      projections,
      yearlyData,
      allocationPlan: normalizeAllocationPlan(ai.allocationPlan, monthlyAmount, riskAppetite),
      planSummary: ai.planSummary || fallback.planSummary,
      topPriority: ai.topPriority || fallback.topPriority,
      rebalanceFrequency: ai.rebalanceFrequency || fallback.rebalanceFrequency,
      emergencyFundAdvice: ai.emergencyFundAdvice || fallback.emergencyFundAdvice,
      taxNote: ai.taxNote || fallback.taxNote,
      bestCaseNote: ai.bestCaseNote || fallback.bestCaseNote,
      worstCaseNote: ai.worstCaseNote || fallback.worstCaseNote,
      sipStartAdvice: ai.sipStartAdvice || fallback.sipStartAdvice,
      gapAnalysis,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("SIP optimizer fallback used:", error);
    return NextResponse.json(
      buildSipOptimizerFallback({
        monthlyAmount,
        goalName,
        timelineYears,
        riskAppetite,
        currentCorpus,
        portfolioContext,
      })
    );
  }
}
