import { NextResponse } from "next/server";
import { MoodResponse } from "@/lib/types/mood";
import { getStockQuote } from "@/lib/yfinance";

function determineMood(niftyChange: number, vix: number): MoodResponse["mood"] {
  if (niftyChange > 1.5 && vix < 13) return "BULLISH";
  if (niftyChange > 0.5 && vix < 15) return "OPTIMISTIC";
  if (niftyChange < -1.5 && vix > 20) return "FEARFUL";
  if (niftyChange < -0.5 || vix > 17) return "CAUTIOUS";
  return "NEUTRAL";
}

function moodMeta(mood: MoodResponse["mood"]) {
  switch (mood) {
    case "FEARFUL":
      return { label: "Risk-off tape", color: "bg-red-500/15 text-red-300 border-red-400/30" };
    case "CAUTIOUS":
      return { label: "Volatility elevated", color: "bg-amber-500/15 text-amber-300 border-amber-400/30" };
    case "OPTIMISTIC":
      return { label: "Constructive breadth", color: "bg-lime-500/15 text-lime-300 border-lime-400/30" };
    case "BULLISH":
      return { label: "Broad risk-on", color: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" };
    default:
      return { label: "Balanced tape", color: "bg-white/10 text-white/80 border-white/15" };
  }
}

function inferFiiFlow(niftyChange: number): string {
  if (niftyChange > 0.75) return "Net Buyer";
  if (niftyChange < -0.75) return "Net Seller";
  return "Mixed";
}

function buildFallbackMood(): MoodResponse {
  const mood = "NEUTRAL" as const;
  return {
    mood,
    niftyChange: 0.12,
    vix: 14.8,
    fiiFlow: "Mixed",
    ...moodMeta(mood),
  };
}

export async function GET() {
  try {
    const [nifty, vixQuote] = await Promise.all([
      getStockQuote("^NSEI"),
      getStockQuote("^INDIAVIX"),
    ]);

    if (!nifty || !vixQuote) {
      return NextResponse.json(buildFallbackMood());
    }

    const mood = determineMood(nifty.changePercent, vixQuote.price);
    return NextResponse.json({
      mood,
      niftyChange: Number(nifty.changePercent.toFixed(2)),
      vix: Number(vixQuote.price.toFixed(1)),
      fiiFlow: inferFiiFlow(nifty.changePercent),
      ...moodMeta(mood),
    } satisfies MoodResponse);
  } catch (error) {
    console.error("Mood API failed:", error);
    return NextResponse.json(buildFallbackMood());
  }
}

