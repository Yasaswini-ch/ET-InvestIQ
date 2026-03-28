import { NextRequest } from "next/server";
import { generateStructuredJSON } from "@/lib/gemini";
import { rateLimit, getIP } from "@/lib/rateLimit";

type Allocation = {
  largeCap: number;
  midCap: number;
  smallCap: number;
  debt: number;
  gold: number;
};

type StressRequestBody = {
  allocation: Allocation;
  totalValue: number;
  worstScenarioName: string;
  worstDrop: number;
};

type StressResponse = {
  riskRating: "LOW" | "MEDIUM" | "HIGH";
  riskSummary: string;
  protectiveActions: string[];
  safeHavenAdvice: string;
  rebalanceSuggestion: string;
  overallRiskRating: "low" | "medium" | "high";
};

function clampNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function buildFallbackResponse(worstDrop: number): StressResponse {
  const severity = Math.abs(worstDrop);
  if (severity > 45) {
    return {
      riskRating: "HIGH",
      overallRiskRating: "high",
      riskSummary:
        "Your portfolio has high crash sensitivity due to significant small and mid cap exposure. Large drawdowns could hurt behaviour as much as returns, so the portfolio needs a stronger stabiliser mix.",
      protectiveActions: [
        "Add 10-15% gold ETF allocation.",
        "Shift 15% to overnight or liquid funds.",
        "Cap small cap at 10% maximum.",
      ],
      safeHavenAdvice: "Consider adding sovereign gold bonds or a gold ETF for crash resilience.",
      rebalanceSuggestion: "Rebalance toward 40% large cap, 20% mid cap, 10% small cap, 20% debt, and 10% gold.",
    };
  }

  if (severity >= 25) {
    return {
      riskRating: "MEDIUM",
      overallRiskRating: "medium",
      riskSummary:
        "Your portfolio can handle normal corrections, but the mix will still feel uncomfortable in a deep selloff. A more balanced mix would reduce drawdown stress without killing growth.",
      protectiveActions: [
        "Keep at least 10% in debt or liquid funds.",
        "Trim one layer of small cap exposure if you already own multiple high-volatility funds.",
        "Review equity weight after each major market correction.",
      ],
      safeHavenAdvice: "A small gold or debt allocation can soften the next drawdown.",
      rebalanceSuggestion: "Aim for roughly 35% large cap, 20% mid cap, 15% small cap, 20% debt, and 10% gold.",
    };
  }

  return {
    riskRating: "LOW",
    overallRiskRating: "low",
    riskSummary:
      "Your mix is reasonably resilient and should be easier to stay invested through during market stress. The main job now is consistency, not major structural changes.",
    protectiveActions: [
      "Keep SIPs automated.",
      "Rebalance once or twice a year.",
      "Maintain a separate emergency fund so equity holdings stay invested.",
    ],
    safeHavenAdvice: "A modest debt sleeve is enough unless your goals are very near term.",
    rebalanceSuggestion: "Keep the current allocation broadly intact and only rebalance if one bucket drifts materially.",
  };
}

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  if (!rateLimit(ip, 3, 60_000)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: Partial<StressRequestBody> = {};
  try {
    body = (await req.json()) as Partial<StressRequestBody>;
  } catch {
    body = {};
  }

  const allocation: Allocation = {
    largeCap: clampNumber(body.allocation?.largeCap),
    midCap: clampNumber(body.allocation?.midCap),
    smallCap: clampNumber(body.allocation?.smallCap),
    debt: clampNumber(body.allocation?.debt),
    gold: clampNumber(body.allocation?.gold),
  };
  const totalValue = clampNumber(body.totalValue);
  const worstScenarioName = String(body.worstScenarioName || "Historical Crash");
  const worstDrop = clampNumber(body.worstDrop);

  const SYSTEM = "You are a risk analyst for Indian equity markets. Return only JSON.";
  const USER = `Portfolio allocation:
Large Cap: ${allocation.largeCap}%
Mid Cap: ${allocation.midCap}%
Small Cap: ${allocation.smallCap}%
Debt: ${allocation.debt}%
Gold: ${allocation.gold}%
Total value: Rs. ${totalValue.toLocaleString("en-IN")}
Worst historical scenario: ${worstScenarioName} (${worstDrop}%)

Return:
{
  "riskRating": "LOW" | "MEDIUM" | "HIGH",
  "riskSummary": string,
  "protectiveActions": string[],
  "safeHavenAdvice": string,
  "rebalanceSuggestion": string
}`;

  try {
    const ai = await generateStructuredJSON<Omit<StressResponse, "overallRiskRating">>(USER, SYSTEM);
    const response: StressResponse = {
      ...ai,
      overallRiskRating: ai.riskRating.toLowerCase() as StressResponse["overallRiskRating"],
    };
    return Response.json(response);
  } catch (error) {
    console.error("Stress route fallback used:", error);
    return Response.json(buildFallbackResponse(worstDrop));
  }
}
