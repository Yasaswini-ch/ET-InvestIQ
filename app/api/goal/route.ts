import { NextRequest } from "next/server";
import { generateStructuredJSON } from "@/lib/gemini";
import { rateLimit, getIP } from "@/lib/rateLimit";

type GoalPlanResponse = {
  goal: string;
  targetAmount: number;
  years: number;
  requiredMonthlySIP: number;
  existingPortfolioProjected: number;
  additionalCorpusNeeded: number;
  fundAllocation: Array<{
    fundName: string;
    category: string;
    monthlyAmount: number;
    percentage: number;
    reason: string;
    etMarketsLink: string;
  }>;
  milestones: Array<{ year: number; projectedCorpus: number; percentComplete: number }>;
  taxSavingTip: string;
  riskNote: string;
  summary: string;
};

function buildFallbackGoalPlan(goal: string, targetAmount: number, years: number, existingPortfolioValue: number): GoalPlanResponse {
  const requiredMonthlySIP = Math.max(1000, Math.round((targetAmount - existingPortfolioValue) / Math.max(years * 12, 1)));
  const fundAllocation = [
    { fundName: "HDFC Nifty 50 Index Fund", category: "Large Cap", monthlyAmount: Math.round(requiredMonthlySIP * 0.4), percentage: 40, reason: "Core exposure with low cost.", etMarketsLink: "https://economictimes.indiatimes.com/mf/analysis" },
    { fundName: "Parag Parikh Flexi Cap Fund", category: "Flexi Cap", monthlyAmount: Math.round(requiredMonthlySIP * 0.35), percentage: 35, reason: "Balanced long-term growth with diversification.", etMarketsLink: "https://economictimes.indiatimes.com/mf/analysis" },
    { fundName: "HDFC Hybrid Debt Fund", category: "Hybrid", monthlyAmount: Math.max(0, requiredMonthlySIP - Math.round(requiredMonthlySIP * 0.75)), percentage: 25, reason: "Adds stability while keeping growth potential.", etMarketsLink: "https://economictimes.indiatimes.com/mf/analysis" },
  ];
  const milestones = Array.from({ length: Math.max(years, 1) }, (_, index) => ({
    year: index + 1,
    projectedCorpus: Math.round(existingPortfolioValue + requiredMonthlySIP * 12 * (index + 1) * 1.08),
    percentComplete: Math.min(100, Math.round(((index + 1) / Math.max(years, 1)) * 100)),
  }));

  return {
    goal,
    targetAmount,
    years,
    requiredMonthlySIP,
    existingPortfolioProjected: Math.round(existingPortfolioValue * 1.08 ** years),
    additionalCorpusNeeded: Math.max(0, targetAmount - existingPortfolioValue),
    fundAllocation,
    milestones,
    taxSavingTip: "Review ELSS or other tax-efficient options if your goal horizon is longer than 3 years.",
    riskNote: "Keep the plan diversified and avoid changing allocation too often.",
    summary: "This fallback plan keeps your SIP moving even if the AI planner is unavailable.",
  };
}

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  if (!rateLimit(ip, 5, 60_000)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const { goal, targetAmount, years, existingPortfolioValue } = await req.json();

  const SYSTEM = `You are a certified financial planner specializing in Indian retail investors. Return only valid JSON.`;

  const prompt = `
Create a goal-based investment plan for an Indian investor:

Goal: ${goal}
Target amount: ₹${Number(targetAmount).toLocaleString("en-IN")}
Time horizon: ${years} years
Existing portfolio value: ₹${Number(existingPortfolioValue ?? 0).toLocaleString("en-IN")}

Return:
{
  "goal": string,
  "targetAmount": number,
  "years": number,
  "requiredMonthlySIP": number,
  "existingPortfolioProjected": number,
  "additionalCorpusNeeded": number,
  "fundAllocation": [
    {
      "fundName": string,
      "category": string,
      "monthlyAmount": number,
      "percentage": number,
      "reason": string,
      "etMarketsLink": "https://economictimes.indiatimes.com/mf/analysis"
    }
  ],
  "milestones": [
    { "year": number, "projectedCorpus": number, "percentComplete": number }
  ],
  "taxSavingTip": string,
  "riskNote": string,
  "summary": "One motivating sentence about reaching this goal"
}

Suggest real, well-known Indian mutual funds. Include at least one ELSS if years > 3.
Make the fund split practical and diversified.
`;

  try {
    const result = await generateStructuredJSON<GoalPlanResponse>(prompt, SYSTEM);
    return Response.json(result);
  } catch (error) {
    console.error("Goal planner fallback used:", error);
    return Response.json(buildFallbackGoalPlan(String(goal), Number(targetAmount), Number(years), Number(existingPortfolioValue ?? 0)));
  }
}
