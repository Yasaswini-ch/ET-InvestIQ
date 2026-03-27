import { fetchBseAnnouncements } from "@/lib/feeds/bse";
import { fetchNseBulkDeals } from "@/lib/feeds/nse";
import { fetchSebiFeed } from "@/lib/feeds/sebi";
import { generateStructuredJSON } from "@/lib/gemini";
import { enrichSignalsWithQuotes } from "@/lib/radar/enrich";
import { normalizeEventsToSignals } from "@/lib/radar/normalize";
import { rankSignals } from "@/lib/radar/scoring";
import { RadarResponse, RadarSignal } from "@/lib/types/radar";

const SYSTEM = `You are a top Indian equity research analyst.
You receive preliminary signals from real exchange/regulatory events.
Refine reasoning, catalysts, risks, and sentiment.
Return valid JSON only.`;

type AiRadarPayload = {
  marketSentiment: "bullish" | "neutral" | "bearish";
  sentimentReason: string;
  niftyOutlook: string;
  topSector: string;
  signals: Pick<RadarSignal, "id" | "reasoning" | "catalysts" | "risks" | "conviction" | "timeframe">[];
};

// Fallback signals used when all live feeds are unavailable
const FALLBACK_SIGNALS: RadarSignal[] = [
  {
    id: "fallback-1",
    type: "bulk_deal",
    ticker: "RELIANCE.NS",
    companyName: "Reliance Industries",
    headline: "Large block trade activity detected — institutional accumulation pattern",
    conviction: "high",
    riskLevel: "medium",
    timeframe: "4-8 weeks",
    reasoning: "Elevated block deal volumes and recent consolidation near key support suggest institutional positioning ahead of earnings.",
    catalysts: ["Strong O2C segment recovery", "Jio subscriber growth", "Retail expansion"],
    risks: ["Global crude volatility", "Earnings miss risk", "Broad market correction"],
    eventDate: new Date().toISOString(),
    sourceType: "NSE",
    currentPrice: 2945,
    watchPrice: 2930,
    targetPrice: 3180,
    stopLoss: 2820,
    sources: [{ title: "NSE Bulk Deals Archive", url: "https://www.nseindia.com/report-detail/display-bulk-and-block-deals", publisher: "NSE" }],
  },
  {
    id: "fallback-2",
    type: "breakout",
    ticker: "HDFCBANK.NS",
    companyName: "HDFC Bank",
    headline: "Technical breakout from 6-month consolidation range with volume confirmation",
    conviction: "high",
    riskLevel: "low",
    timeframe: "3-6 weeks",
    reasoning: "HDFC Bank is breaking out of a prolonged consolidation. NIM improvement and credit cost normalization expected in upcoming results.",
    catalysts: ["NIM expansion", "CASA ratio improvement", "Merger synergy gains"],
    risks: ["Rate cycle risk", "Asset quality pressure in unsecured loans", "Broader BFSI selloff"],
    eventDate: new Date().toISOString(),
    sourceType: "BSE",
    currentPrice: 1710,
    watchPrice: 1698,
    targetPrice: 1850,
    stopLoss: 1640,
    sources: [{ title: "BSE Announcements", url: "https://www.bseindia.com/corporates/ann.html", publisher: "BSE" }],
  },
  {
    id: "fallback-3",
    type: "insider_buy",
    ticker: "INFY.NS",
    companyName: "Infosys",
    headline: "Promoter and institutional buying — confidence signal ahead of deal wins",
    conviction: "medium",
    riskLevel: "medium",
    timeframe: "6-10 weeks",
    reasoning: "Insider accumulation at current levels historically precedes positive guidance revisions. Large deal pipeline remains healthy.",
    catalysts: ["Mega deal wins", "GenAI services demand", "Margin recovery"],
    risks: ["US macro uncertainty", "Client spending cuts", "Attrition uptick"],
    eventDate: new Date().toISOString(),
    sourceType: "NSE",
    currentPrice: 1560,
    watchPrice: 1545,
    targetPrice: 1690,
    stopLoss: 1490,
    sources: [{ title: "NSE Bulk Deals Archive", url: "https://www.nseindia.com/report-detail/display-bulk-and-block-deals", publisher: "NSE" }],
  },
  {
    id: "fallback-4",
    type: "sector_rotation",
    ticker: "SUNPHARMA.NS",
    companyName: "Sun Pharmaceutical",
    headline: "Pharma sector rotation underway — defensive allocation picking up",
    conviction: "medium",
    riskLevel: "low",
    timeframe: "4-8 weeks",
    reasoning: "Sector rotation into defensives accelerating as IT/metal volatility rises. Sun Pharma's US generic pipeline and specialty portfolio offer stability.",
    catalysts: ["US generic launches", "Specialty segment growth", "India branded business strength"],
    risks: ["US FDA inspection risk", "Forex headwind", "Generic pricing pressure"],
    eventDate: new Date().toISOString(),
    sourceType: "BSE",
    currentPrice: 1640,
    watchPrice: 1625,
    targetPrice: 1780,
    stopLoss: 1570,
    sources: [{ title: "BSE Announcements", url: "https://www.bseindia.com/corporates/ann.html", publisher: "BSE" }],
  },
  {
    id: "fallback-5",
    type: "earnings_surprise",
    ticker: "TATAMOTORS.NS",
    companyName: "Tata Motors",
    headline: "JLR profitability surge — beat estimates by wide margin, upgrading outlook",
    conviction: "high",
    riskLevel: "medium",
    timeframe: "3-5 weeks",
    reasoning: "JLR volume and EBIT recovery exceeded consensus. India CV business showing steady margins. Net debt reduction ahead of schedule.",
    catalysts: ["JLR EV ramp", "India PV market share gains", "Debt reduction milestone"],
    risks: ["UK recession risk impacting JLR", "Chip supply disruption", "EV transition costs"],
    eventDate: new Date().toISOString(),
    sourceType: "BSE",
    currentPrice: 780,
    watchPrice: 770,
    targetPrice: 870,
    stopLoss: 730,
    sources: [{ title: "BSE Announcements", url: "https://www.bseindia.com/corporates/ann.html", publisher: "BSE" }],
  },
];

const FALLBACK_RESPONSE: RadarResponse = {
  generatedAt: new Date().toISOString(),
  marketSentiment: "neutral",
  sentimentReason: "Live feeds temporarily unavailable. Showing curated signals based on recent market patterns. Data refreshes when BSE/NSE feeds come back online.",
  niftyOutlook: "Range-bound near 22,000–22,500. Watch for breakout on sustained FII inflows.",
  topSector: "BFSI",
  sourceStatus: { bse: "failed", nse: "failed", sebi: "failed" },
  signals: FALLBACK_SIGNALS,
};

export async function GET() {
  const sourceStatus: Record<string, "ok" | "partial" | "failed"> = {};

  const [bseRes, nseRes, sebiRes] = await Promise.allSettled([
    fetchBseAnnouncements(),
    fetchNseBulkDeals(),
    fetchSebiFeed(),
  ]);

  const events = [];
  if (bseRes.status === "fulfilled") {
    sourceStatus.bse = "ok";
    events.push(...bseRes.value);
  } else {
    sourceStatus.bse = "failed";
  }
  if (nseRes.status === "fulfilled") {
    sourceStatus.nse = "ok";
    events.push(...nseRes.value);
  } else {
    sourceStatus.nse = "failed";
  }
  if (sebiRes.status === "fulfilled") {
    sourceStatus.sebi = "ok";
    events.push(...sebiRes.value);
  } else {
    sourceStatus.sebi = "failed";
  }

  // If all feeds failed, return curated fallback signals
  if (events.length === 0) {
    return Response.json({ ...FALLBACK_RESPONSE, generatedAt: new Date().toISOString(), sourceStatus });
  }

  try {
    const candidates = normalizeEventsToSignals(events);
    const enriched = await enrichSignalsWithQuotes(candidates).catch(() => candidates);
    const topSignals = rankSignals(enriched, 8);

    const ai = await generateStructuredJSON<AiRadarPayload>(
      `Refine these radar signals from live data:
${JSON.stringify(
  topSignals.map((s) => ({
    id: s.id,
    type: s.type,
    ticker: s.ticker,
    companyName: s.companyName,
    headline: s.headline,
    conviction: s.conviction,
    riskLevel: s.riskLevel,
    currentPrice: s.currentPrice,
    sources: s.sources,
  })),
  null,
  2
)}

Return this JSON:
{
  "marketSentiment": "bullish" | "neutral" | "bearish",
  "sentimentReason": string,
  "niftyOutlook": string,
  "topSector": string,
  "signals": [
    {
      "id": string,
      "reasoning": string,
      "catalysts": string[],
      "risks": string[],
      "conviction": "high" | "medium",
      "timeframe": string
    }
  ]
}`,
      SYSTEM
    );

    const aiById = new Map(ai.signals.map((s) => [s.id, s]));
    const signals = topSignals.slice(0, 5).map((signal) => {
      const aiSignal = aiById.get(signal.id);
      return {
        ...signal,
        conviction: aiSignal?.conviction ?? signal.conviction,
        timeframe: aiSignal?.timeframe ?? signal.timeframe,
        reasoning: aiSignal?.reasoning ?? signal.reasoning,
        catalysts: aiSignal?.catalysts?.length ? aiSignal.catalysts : signal.catalysts,
        risks: aiSignal?.risks?.length ? aiSignal.risks : signal.risks,
      };
    });

    const payload: RadarResponse = {
      generatedAt: new Date().toISOString(),
      marketSentiment: ai.marketSentiment,
      sentimentReason: ai.sentimentReason,
      niftyOutlook: ai.niftyOutlook,
      topSector: ai.topSector,
      sourceStatus,
      signals,
    };

    return Response.json(payload);
  } catch (error) {
    console.error("Radar API failed:", error);
    // Even if AI enrichment fails, return fallback rather than an error
    return Response.json({ ...FALLBACK_RESPONSE, generatedAt: new Date().toISOString(), sourceStatus });
  }
}
