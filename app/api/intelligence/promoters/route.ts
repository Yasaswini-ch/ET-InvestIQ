import { NextResponse } from 'next/server';
import { generateStructuredJSON } from '@/lib/gemini';
import { fetchPromoterSignals } from '@/lib/intelligence/promoterScraper';
import { buildPromoterFallback } from '@/lib/intelligence/fallbacks';

export const revalidate = 3600; // Cache for 1 hour

const AI_TIMEOUT_MS = 12000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timed out")), timeoutMs)),
  ]);
}

export async function GET() {
  try {
    const signals = await fetchPromoterSignals();

    const systemPrompt = `You are a smart money analyst for Indian equity markets. Analyze promoter buying/selling activity and assess conviction. Return ONLY valid JSON. No markdown.`;

    const userPrompt = `Here are recent promoter shareholding changes from BSE disclosures:
${JSON.stringify(signals, null, 2)}

For each signal, assess and return:
{
  "signals": [
    {
      "company": "string",
      "ticker": "string (NSE ticker if known else blank)",
      "changeType": "buy" | "sell",
      "percentageChange": 0,
      "date": "string",
      "convictionScore": 0-100,
      "convictionReason": "string (why this score)",
      "historicalContext": "what happened last time this promoter bought/sold",
      "retailSignal": "strong_buy_signal" | "watch" | "sell_signal" | "noise",
      "riskFactors": ["string"],
      "relatedSector": "string"
    }
  ],
  "marketTheme": "overall theme from promoter activity",
  "smartMoneyMood": "accumulating" | "distributing" | "mixed",
  "topSignal": "the single most important promoter move today"
}`;

    try {
      const json = await withTimeout(generateStructuredJSON(userPrompt, systemPrompt), AI_TIMEOUT_MS);
      return NextResponse.json(json);
    } catch (aiError) {
      console.error("Promoter AI fallback used:", aiError);
      return NextResponse.json(buildPromoterFallback(signals));
    }

  } catch (error) {
    console.error("Promoter API error:", error);
    return NextResponse.json({ error: "Failed to process smart money signals" }, { status: 500 });
  }
}
