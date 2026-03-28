import { NextRequest } from "next/server";
import { generateStructuredJSON } from "@/lib/gemini";
import { rateLimit, getIP } from "@/lib/rateLimit";

const SYSTEM = `You are ET InvestIQ's personal AI briefing engine for Indian retail investors.
Your job: connect a user's portfolio to today's market context and generate highly specific, actionable alerts.
Rules:
- Be specific: use real fund names, stock tickers, SEBI rule numbers if relevant
- Every alert must have a clear action the user can take RIGHT NOW
- Cross-reference portfolio holdings with market signals wherever possible
- If portfolio data is unavailable, give market-wide alerts that any Indian investor would care about
- Always return valid JSON only`;

function buildPrompt(portfolioContext: Record<string, unknown> | null) {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const portfolioSection = portfolioContext
    ? `
INVESTOR PORTFOLIO:
- Investor: ${portfolioContext.investorName}
- Total invested: ₹${Number(portfolioContext.totalInvested)?.toLocaleString("en-IN")}
- Current value: ₹${Number(portfolioContext.currentValue)?.toLocaleString("en-IN")}
- XIRR: ${portfolioContext.overallXIRR}%
- Health score: ${portfolioContext.portfolioHealthScore}/100
- Risk profile: ${portfolioContext.riskProfile}
- Funds held: ${(portfolioContext.funds as {name: string}[])?.map((f) => f.name).join(", ")}
- Key issues: ${(portfolioContext.insights as {title: string}[])?.map((i) => i.title).join("; ")}
`
    : "No portfolio uploaded — generate general market alerts for an Indian retail investor.";

  return `
Today is ${today}. Generate a personalised daily briefing for this investor.

${portfolioSection}

Return this exact JSON:
{
  "generatedAt": "ISO timestamp",
  "investorName": "${portfolioContext?.investorName ?? "Investor"}",
  "marketMood": "one phrase like 'Cautiously Bullish' or 'Risk-Off Mode'",
  "moodEmoji": "one emoji",
  "headline": "One punchy sentence summarising today's most important insight for this investor",
  "alerts": [
    {
      "id": "alert_1",
      "severity": "high" | "medium" | "low",
      "category": "portfolio" | "market" | "opportunity" | "action",
      "title": "Short alert title (max 8 words)",
      "detail": "2-3 sentences with specific data, fund names, or tickers. Be concrete.",
      "action": "One specific thing the investor should do today",
      "linkedFeature": "/xray" | "/radar" | "/charts" | "/chat",
      "linkedLabel": "Short label like 'View in X-Ray' or 'See Radar Signal'"
    }
  ],
  "topOpportunity": "1-2 sentences on the best opportunity for this investor right now",
  "urgentAction": "The single most important thing to do this week"
}

Generate 4-6 alerts. Mix categories. At least one must reference a specific fund or stock.
If portfolio data is available, at least 2 alerts must directly reference their holdings.
`;
}

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  if (!rateLimit(ip, 3, 60_000)) {
    return Response.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    const { portfolioContext } = await req.json();
    const prompt = buildPrompt(portfolioContext);
    const briefing = await generateStructuredJSON<any>(prompt, SYSTEM);
    briefing.generatedAt = new Date().toISOString();
    return Response.json(briefing);
  } catch (err) {
    console.error("Briefing error:", err);
    return Response.json(
      { error: "Failed to generate briefing" },
      { status: 500 }
    );
  }
}
