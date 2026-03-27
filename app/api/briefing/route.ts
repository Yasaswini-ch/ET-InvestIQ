import { NextRequest, NextResponse } from "next/server";
import { generateStructuredJSON } from "@/lib/gemini";
import { fetchBseAnnouncements } from "@/lib/feeds/bse";
import { fetchNseBulkDeals } from "@/lib/feeds/nse";
import { fetchSebiFeed } from "@/lib/feeds/sebi";
import { enrichSignalsWithQuotes } from "@/lib/radar/enrich";
import { normalizeEventsToSignals } from "@/lib/radar/normalize";
import { rankSignals } from "@/lib/radar/scoring";
import { PortfolioChatContext } from "@/lib/types/chat";
import { getIndianMarketData } from "@/lib/yfinance";

export const dynamic = "force-dynamic";

type BriefingResponse = {
  headline: string;
  summary: string;
  marketPulse: "risk_on" | "neutral" | "risk_off";
  priorities: string[];
  opportunities: string[];
  risks: string[];
  actionPlan: string[];
};

const SYSTEM = `You are the chief investment editor for ET InvestIQ.
Create a concise personalized daily financial briefing.
Use portfolio context + live market snapshot + live radar signals.
Style: specific, practical, no hype.
Return valid JSON only.`;

async function loadSignals() {
  const [bseRes, nseRes, sebiRes] = await Promise.allSettled([
    fetchBseAnnouncements(),
    fetchNseBulkDeals(),
    fetchSebiFeed(),
  ]);

  const events = [];
  if (bseRes.status === "fulfilled") events.push(...bseRes.value);
  if (nseRes.status === "fulfilled") events.push(...nseRes.value);
  if (sebiRes.status === "fulfilled") events.push(...sebiRes.value);
  if (!events.length) return [];

  const normalized = normalizeEventsToSignals(events);
  const enriched = await enrichSignalsWithQuotes(normalized);
  return rankSignals(enriched, 6);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const portfolioContext = (body?.portfolioContext ?? null) as PortfolioChatContext | null;

    const [market, signals] = await Promise.all([getIndianMarketData(), loadSignals()]);

    const ai = await generateStructuredJSON<BriefingResponse>(
      `Build today's unified financial briefing using this context:
{
  "portfolioContext": ${JSON.stringify(portfolioContext, null, 2)},
  "market": ${JSON.stringify(market, null, 2)},
  "radarSignals": ${JSON.stringify(
        signals.map((s) => ({
          ticker: s.ticker,
          type: s.type,
          headline: s.headline,
          conviction: s.conviction,
          currentPrice: s.currentPrice,
          source: s.sources?.[0]?.publisher,
        })),
        null,
        2
      )}
}

Return JSON:
{
  "headline": string,
  "summary": string,
  "marketPulse": "risk_on" | "neutral" | "risk_off",
  "priorities": string[],
  "opportunities": string[],
  "risks": string[],
  "actionPlan": string[]
}

Make it feel like one connected platform, not isolated tools.`,
      SYSTEM
    );

    return NextResponse.json({
      ...ai,
      generatedAt: new Date().toISOString(),
      sources: {
        market: "Yahoo Finance",
        radar: signals.length,
      },
    });
  } catch (error) {
    console.error("Briefing API failed:", error);
    return NextResponse.json(
      {
        headline: "Your Financial Briefing Is Loading",
        summary: "We could not generate a full personalized briefing right now. Try again in a moment.",
        marketPulse: "neutral",
        priorities: ["Review portfolio risk concentration before new entries."],
        opportunities: ["Track high-conviction radar signals after price confirmation."],
        risks: ["Short-term volatility remains elevated across sectors."],
        actionPlan: ["Open Portfolio X-Ray and revalidate your top 3 holdings."],
        generatedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
