import { NextRequest } from "next/server";
import { generateStructuredJSON } from "@/lib/gemini";
import { rateLimit, getIP } from "@/lib/rateLimit";

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
    const result = await generateStructuredJSON<any>(prompt, SYSTEM);
    return Response.json(result);
  } catch {
    return Response.json({ error: "Goal planning failed" }, { status: 500 });
  }
}
