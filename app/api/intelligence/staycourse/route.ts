import { NextResponse } from "next/server";
import { generateStructuredJSON } from "@/lib/gemini";
import { rateLimit, getIP } from "@/lib/rateLimit";
import { buildStayCourseFallback } from "@/lib/intelligence/fallbacks";

const AI_TIMEOUT_MS = 12000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timed out")), timeoutMs)),
  ]);
}

export async function POST(req: Request) {
  const ip = getIP(req);
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const { monthlyAmount, fundName, currentNAV, peakNAV, portfolioContext } = await req.json();

    if (!monthlyAmount || !fundName || !currentNAV || !peakNAV) {
      return NextResponse.json({ error: "Missing required inputs" }, { status: 400 });
    }

    const drawdownPercent = ((peakNAV - currentNAV) / peakNAV) * 100;
    const discountedUnitsThisMonth = monthlyAmount / currentNAV;
    const normalUnitsAtPeak = monthlyAmount / peakNAV;
    const bonusUnits = discountedUnitsThisMonth - normalUnitsAtPeak;
    const bonusUnitsPercent = (bonusUnits / normalUnitsAtPeak) * 100;

    const assumedRecoveryNAV = currentNAV * 1.15;
    const corpusIfContinued = discountedUnitsThisMonth * 3 * assumedRecoveryNAV;
    const opportunityCost = corpusIfContinued;

    const r = 0.11 / 12;
    const n = 120;
    const projectedCorpus10yr = monthlyAmount * (((1 + r) ** n - 1) / r) * (1 + r);

    const isMarketDown = drawdownPercent > 5;
    const score = portfolioContext?.healthScore ?? 0;
    const portfolioString = portfolioContext ? `- Portfolio health score: ${score}/100` : "";

    const systemPrompt =
      "You are a behavioral finance coach for Indian retail investors. Be encouraging but factual. Return ONLY valid JSON. No markdown.";

    const userPrompt = `Market data:
- Fund: ${fundName}
- Current NAV drawdown from peak: ${drawdownPercent.toFixed(1)}%
- Investor's monthly SIP: Rs. ${monthlyAmount}
- Bonus units being accumulated this month: ${bonusUnits.toFixed(2)} extra units
- Opportunity cost of pausing 3 months: Rs. ${opportunityCost.toFixed(0)}
${portfolioString}

Return:
{
  "emotionalTrigger": "The one sentence that will stop them from cancelling (be powerful, behavioral)",
  "historicalParallel": "A real example: 'Investors who continued SIP through COVID...'",
  "unitAccumulationInsight": "Plain English emphasizing the bonus units",
  "recoveryTimeline": "Based on historical Indian market recovery patterns",
  "commitmentStatement": "A short personal commitment statement"
}`;

    let insight;
    try {
      insight = await withTimeout(generateStructuredJSON(userPrompt, systemPrompt), AI_TIMEOUT_MS);
    } catch (aiError) {
      console.error("StayCourse AI fallback used:", aiError);
      return NextResponse.json(
        buildStayCourseFallback(
          {
            drawdownPercent,
            discountedUnitsThisMonth,
            normalUnitsAtPeak,
            bonusUnits,
            bonusUnitsPercent,
            opportunityCost,
            projectedCorpus10yr,
          },
          drawdownPercent
        )
      );
    }

    return NextResponse.json({
      math: {
        drawdownPercent,
        discountedUnitsThisMonth,
        normalUnitsAtPeak,
        bonusUnits,
        bonusUnitsPercent,
        opportunityCost,
        projectedCorpus10yr,
      },
      insight,
      niftyContext: {
        isMarketDown,
        drawdownFromPeak: Math.max(5.1, drawdownPercent),
      },
    });
  } catch (error) {
    console.error("StayCourse API error:", error);
    return NextResponse.json({ error: "Failed to process behavioral insights" }, { status: 500 });
  }
}
