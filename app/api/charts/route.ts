import { NextRequest, NextResponse } from "next/server";
import { summarizeCandles } from "@/lib/chart-analysis";
import { generateStructuredJSON } from "@/lib/gemini";
import { ChartPatternInsight, ChartPatternResponse } from "@/lib/types/market";
import { getHistoricalOHLCV, normalizeNseTicker } from "@/lib/yfinance";

type AiPatternPayload = {
  patterns: ChartPatternInsight[];
  similarHistorical: string[];
};

export const dynamic = "force-dynamic";

const SYSTEM = `You are a technical analyst for Indian equities.
Analyze the summarized setup and return JSON only.
Do not output markdown.
successRate must be an AI-estimated historical probability between 1 and 99.
confidence must be between 1 and 100.`;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ticker = normalizeNseTicker(searchParams.get("ticker") || "RELIANCE");
    const range = searchParams.get("range") || "6mo";
    const interval = searchParams.get("interval") || "1d";

    const candles = await getHistoricalOHLCV(ticker, range, interval);
    if (candles.length < 30) {
      return NextResponse.json({ error: "Not enough candle data for analysis" }, { status: 422 });
    }

    const summary = summarizeCandles(candles);
    const ai = await generateStructuredJSON<AiPatternPayload>(
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
      patterns: ai.patterns ?? [],
      similarHistorical: ai.similarHistorical ?? [],
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Charts API failed:", error);
    return NextResponse.json({ error: "Failed to analyze chart patterns" }, { status: 500 });
  }
}
