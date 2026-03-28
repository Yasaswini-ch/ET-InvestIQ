import { rateLimit, getIP } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";
import { summarizeCandles } from "@/lib/chart-analysis";
import { generateStructuredJSON } from "@/lib/gemini";
import { ChartPatternInsight, ChartPatternResponse } from "@/lib/types/market";
import { getHistoricalOHLCV, normalizeNseTicker } from "@/lib/yfinance";

type AiPatternPayload = {
  patterns: ChartPatternInsight[];
  similarHistorical: string[];
};

function buildFallbackPatterns(summary: ReturnType<typeof summarizeCandles>): AiPatternPayload {
  const patterns: ChartPatternInsight[] = [];
  const confidenceBase = summary.trend === "bullish" ? 72 : summary.trend === "bearish" ? 68 : 58;

  if (summary.breakoutPoint) {
    patterns.push({
      name: summary.trend === "bearish" ? "Breakdown Pressure" : "Breakout Setup",
      bias: summary.trend === "bearish" ? "bearish" : "bullish",
      confidence: Math.min(95, confidenceBase + 8),
      successRate: Math.min(90, confidenceBase + 5),
      explanation:
        summary.trend === "bullish"
          ? "Price is trading near resistance with bullish structure and a possible breakout confirmation."
          : "Price is leaning into support or losing structure, which can extend downside if sellers continue to press.",
      riskNote: summary.volumeSpike
        ? "Volume is elevated, so confirmation or rejection can happen quickly."
        : "Watch for a volume confirmation before acting aggressively.",
    });
  } else {
    patterns.push({
      name: summary.trend === "bullish" ? "Trend Continuation" : summary.trend === "bearish" ? "Trend Breakdown" : "Range Compression",
      bias: summary.trend,
      confidence: confidenceBase,
      successRate: Math.max(45, confidenceBase - 6),
      explanation:
        summary.trend === "neutral"
          ? "The chart is consolidating between support and resistance, so patience matters more than chasing."
          : summary.trend === "bullish"
            ? "Momentum is constructive, but the move still needs a fresh follow-through candle."
            : "Momentum is weak, and sellers remain in control until price recovers key levels.",
      riskNote: summary.volumeSpike
        ? "Volume is elevated, so the setup can resolve faster than usual."
        : "Keep risk tight because the setup is still developing.",
    });
  }

  if (summary.volumeSpike) {
    patterns.push({
      name: "Volume Expansion",
      bias: summary.trend === "bearish" ? "bearish" : "bullish",
      confidence: Math.min(88, confidenceBase + 4),
      successRate: Math.min(85, confidenceBase + 3),
      explanation: "The latest candle shows a meaningful volume surge, which often precedes a stronger move or a rejection from the current zone.",
      riskNote: "If the move fails, the reversal can be sharp because volume is already high.",
    });
  }

  const similarHistorical = [
    `${summary.trend === "bullish" ? "Previous bullish" : summary.trend === "bearish" ? "Previous bearish" : "Previous range-bound"} setups on this stock often resolved after a clean test of support and resistance.`,
    `When price stayed above the ${summary.supportZones[0]?.toFixed(2) || "key support"} zone, follow-through improved over the next few sessions.`,
  ];

  return { patterns: patterns.slice(0, 3), similarHistorical };
}

export const dynamic = "force-dynamic";

const SYSTEM = `You are a technical analyst for Indian equities.
Analyze the summarized setup and return JSON only.
Do not output markdown.
successRate must be an AI-estimated historical probability between 1 and 99.
confidence must be between 1 and 100.`;

export async function GET(req: NextRequest) {
  const ip = getIP(req);
  if (!rateLimit(ip, 8, 60_000)) {
    return Response.json(
      { error: "Too many requests. Please wait a minute." },
      { status: 429 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const ticker = normalizeNseTicker(searchParams.get("ticker") || "RELIANCE");
    const range = searchParams.get("range") || "6mo";
    const interval = searchParams.get("interval") || "1d";

    let candles;
    try {
      candles = await getHistoricalOHLCV(ticker, range, interval);
    } catch {
      return NextResponse.json(
        { error: `Ticker "${ticker}" not found on Yahoo Finance. Try full NSE symbols like TATAMOTORS, HDFCBANK, or RELIANCE.` },
        { status: 422 }
      );
    }
    if (candles.length < 30) {
      return NextResponse.json({ error: `Not enough historical data for "${ticker}". Try a longer range or a different ticker.` }, { status: 422 });
    }

    const summary = summarizeCandles(candles);
    let aiPayload: AiPatternPayload | null = null;
    try {
      aiPayload = await generateStructuredJSON<AiPatternPayload>(
        `Analyze this stock setup and respond with:
{
  "patterns": [
    {
      "name": string,
      "bias": "bullish" | "bearish" | "neutral",
      "confidence": number,
      "successRate": number,
      "explanation": string,
      "riskNote": string
    }
  ],
  "similarHistorical": string[]
}

Stock data summary:
${JSON.stringify({ ticker, range, interval, summary }, null, 2)}

Return 1 to 3 useful patterns only.
Also include 1 to 3 "similarHistorical" lines in this style:
"Last time RELIANCE formed this setup (Mar 2023), it moved +14% in 3 weeks."`,
        SYSTEM
      );
    } catch (error) {
      console.error("Charts AI fallback used:", error);
    }

    const fallbackPayload = buildFallbackPatterns(summary);
    const ai = aiPayload ?? fallbackPayload;

    const payload: ChartPatternResponse = {
      ticker,
      range,
      interval,
      candles,
      summary: {
        latestClose: summary.latestClose,
        changePercent: summary.changePercent,
        supportZones: summary.supportZones,
        resistanceZones: summary.resistanceZones,
        volumeSpike: summary.volumeSpike,
        trend: summary.trend,
        breakoutPoint: summary.breakoutPoint,
        patternWindow: summary.patternWindow,
      },
      patterns: ai.patterns ?? fallbackPayload.patterns,
      similarHistorical: ai.similarHistorical ?? fallbackPayload.similarHistorical,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Charts API failed:", message);
    return NextResponse.json({ error: `Analysis failed: ${message}` }, { status: 500 });
  }
}
