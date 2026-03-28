import { NextRequest } from "next/server";
import { generateStructuredJSON } from "@/lib/gemini";
import { rateLimit, getIP } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  if (!rateLimit(ip, 3, 60_000)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const { portfolio } = await req.json();

  const SYSTEM = `You are a risk analyst specializing in Indian equity markets. Return only valid JSON.`;

  const prompt = `
Run a stress test on this Indian mutual fund portfolio:

Portfolio value: ₹${portfolio.currentValue?.toLocaleString("en-IN")}
Funds: ${(portfolio.funds as {name: string; category: string; allocationPercent: number}[])?.map((f) => `${f.name} (${f.category}, ${f.allocationPercent}%)`).join(", ")}
Risk profile: ${portfolio.riskProfile}

Simulate 4 historical crash scenarios for this specific portfolio composition:

{
  "scenarios": [
    {
      "name": "COVID Crash (Mar 2020)",
      "niftyDrop": -38,
      "portfolioDrop": number,
      "portfolioLoss": number,
      "recoveryMonths": number,
      "worstFund": string,
      "bestFund": string,
      "lesson": string
    },
    {
      "name": "2008 Global Crisis",
      "niftyDrop": -60,
      "portfolioDrop": number,
      "portfolioLoss": number,
      "recoveryMonths": number,
      "worstFund": string,
      "bestFund": string,
      "lesson": string
    },
    {
      "name": "2015-16 China Slowdown",
      "niftyDrop": -26,
      "portfolioDrop": number,
      "portfolioLoss": number,
      "recoveryMonths": number,
      "worstFund": string,
      "bestFund": string,
      "lesson": string
    },
    {
      "name": "IT Sector Correction (2022)",
      "niftyDrop": -18,
      "portfolioDrop": number,
      "portfolioLoss": number,
      "recoveryMonths": number,
      "worstFund": string,
      "bestFund": string,
      "lesson": string
    }
  ],
  "overallRiskRating": "low" | "medium" | "high",
  "riskSummary": "2-3 sentences on how resilient this portfolio is to crashes",
  "protectiveActions": ["action 1", "action 2", "action 3"],
  "safeHavenAllocation": "What % should be in debt/gold for this risk profile"
}

Be realistic. Large cap funds drop less than small cap. ELSS behaves like large cap. Index funds track Nifty almost exactly. Debt funds drop very little.
`;

  try {
    const result = await generateStructuredJSON<any>(prompt, SYSTEM);
    return Response.json(result);
  } catch {
    return Response.json({ error: "Stress test failed" }, { status: 500 });
  }
}
