import { rateLimit, getIP } from "@/lib/rateLimit";
import { fetchBseAnnouncements } from "@/lib/feeds/bse";
import { fetchNseBulkDeals } from "@/lib/feeds/nse";
import { fetchSebiFeed } from "@/lib/feeds/sebi";
import { generateStructuredJSON } from "@/lib/gemini";
import { enrichSignalsWithQuotes } from "@/lib/radar/enrich";
import { normalizeEventsToSignals } from "@/lib/radar/normalize";
import { calculateSignalScore, rankSignals } from "@/lib/radar/scoring";
import { RadarResponse, RadarSignal } from "@/lib/types/radar";

export const dynamic = "force-dynamic";

const SYSTEM = `You are a top Indian equity research analyst.
You receive preliminary signals from real exchange/regulatory events.
Refine reasoning, catalysts, risks, and sentiment.
Return valid JSON only.`;

type AiRadarPayload = {
  marketSentiment: "bullish" | "neutral" | "bearish";
  sentimentReason: string;
  niftyOutlook: string;
  topSector: string;
  signals: Pick<
    RadarSignal,
    "id" | "reasoning" | "catalysts" | "risks" | "conviction" | "timeframe" | "whySignal" | "whyItMatters" | "changeSummary"
  >[];
};

function enrichSignalNarrative(signal: RadarSignal): RadarSignal {
  const upside =
    signal.currentPrice && signal.targetPrice && signal.currentPrice > 0
      ? ((signal.targetPrice - signal.currentPrice) / signal.currentPrice) * 100
      : null;
  const signalScore = calculateSignalScore(signal);
  const whySignal =
    signal.type === "bulk_deal"
      ? "Large exchange-reported block activity can reveal institutional positioning before it becomes obvious in price."
      : signal.type === "insider_buy"
        ? "Management or related-party buying often matters because insiders know business momentum earlier than the market."
        : signal.type === "earnings_surprise"
          ? "Earnings beats tend to matter when the result changes forward expectations, not just the last quarter headline."
          : signal.type === "sector_rotation"
            ? "Sector rotation matters when flows move into a theme before broader participation shows up."
            : signal.type === "breakout"
              ? "A breakout matters when price, structure, and participation improve together instead of producing a false move."
              : "A regulatory development matters when it changes expected cash flows, positioning, or compliance risk.";
  const whyItMatters =
    upside !== null
      ? `${signal.companyName} is showing an estimated ${upside >= 0 ? "+" : ""}${upside.toFixed(1)}% move to the current target, so this can affect near-term risk-reward if the setup confirms.`
      : `${signal.companyName} is worth tracking because the event changes the stock's near-term watch level, risk appetite, or sector relevance.`;
  const changeSummary =
    signal.eventDate
      ? `Fresh event logged on ${new Date(signal.eventDate).toLocaleDateString("en-IN")} with ${signal.conviction} conviction and ${signal.timeframe} time frame.`
      : `Signal score moved into the ${signalScore >= 75 ? "high-conviction" : signalScore >= 55 ? "actionable" : "early-watch"} zone based on today's event mix.`;

  return {
    ...signal,
    signalScore,
    whySignal: signal.whySignal || whySignal,
    whyItMatters: signal.whyItMatters || whyItMatters,
    changeSummary: signal.changeSummary || changeSummary,
  };
}

const FALLBACK_SIGNALS: RadarSignal[] = [
  {
    id: "fallback-1",
    type: "bulk_deal",
    ticker: "RELIANCE.NS",
    companyName: "Reliance Industries",
    headline: "Large block trade activity detected - institutional accumulation pattern",
    conviction: "high",
    riskLevel: "medium",
    timeframe: "4-8 weeks",
    reasoning: "Elevated block deal volumes and recent consolidation near key support suggest institutional positioning ahead of earnings.",
    whySignal: "Large block activity with a stable base can point to deliberate accumulation rather than retail noise.",
    whyItMatters: "If accumulation continues, Reliance can influence both index tone and portfolio concentration for large-cap investors.",
    changeSummary: "Fresh block activity raised the signal into a higher-conviction zone versus a normal quiet session.",
    signalScore: 86,
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
    whySignal: "A clean breakout after long consolidation usually matters more than a one-day spike because trapped supply gets absorbed first.",
    whyItMatters: "A sustained HDFC Bank move can change BFSI leadership and impact many portfolios directly or through fund overlap.",
    changeSummary: "Price is attempting to leave a multi-month range with improving structure and cleaner upside trigger levels.",
    signalScore: 83,
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
    headline: "Promoter and institutional buying - confidence signal ahead of deal wins",
    conviction: "medium",
    riskLevel: "medium",
    timeframe: "6-10 weeks",
    reasoning: "Insider accumulation at current levels historically precedes positive guidance revisions. Large deal pipeline remains healthy.",
    whySignal: "Insider-linked accumulation can be more meaningful when it appears near support and ahead of guidance-sensitive quarters.",
    whyItMatters: "Infosys sentiment often spills into the broader IT basket, so this can matter beyond a single stock call.",
    changeSummary: "Accumulation tone improved after a quieter phase, lifting the stock back onto the watchlist.",
    signalScore: 74,
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
    headline: "Pharma sector rotation underway - defensive allocation picking up",
    conviction: "medium",
    riskLevel: "low",
    timeframe: "4-8 weeks",
    reasoning: "Sector rotation into defensives accelerating as IT and metal volatility rises. Sun Pharma's US generic pipeline and specialty portfolio offer stability.",
    whySignal: "Rotation signals matter when relative strength improves before the wider market fully re-rates the sector.",
    whyItMatters: "Defensive leadership can change how investors size cyclical exposure across the rest of the portfolio.",
    changeSummary: "Pharma is attracting steadier flows as traders lean toward lower-volatility positioning.",
    signalScore: 68,
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
    headline: "JLR profitability surge - beat estimates by wide margin, upgrading outlook",
    conviction: "high",
    riskLevel: "medium",
    timeframe: "3-5 weeks",
    reasoning: "JLR volume and EBIT recovery exceeded consensus. India CV business showing steady margins. Net debt reduction ahead of schedule.",
    whySignal: "An earnings surprise matters most when it shifts forward profitability expectations, not only the reported quarter.",
    whyItMatters: "Tata Motors can quickly reprice when JLR profitability improves, which changes both auto sentiment and portfolio beta.",
    changeSummary: "Profitability surprise reset expectations upward and improved the near-term trigger map.",
    signalScore: 84,
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
  niftyOutlook: "Range-bound near 22,000-22,500. Watch for breakout on sustained FII inflows.",
  topSector: "BFSI",
  sourceStatus: { bse: "failed", nse: "failed", sebi: "failed" },
  signals: FALLBACK_SIGNALS,
};

export async function GET(req: Request) {
  try {
    const ip = getIP(req);
    if (!rateLimit(ip, 8, 60_000)) {
      return Response.json({
        ...FALLBACK_RESPONSE,
        generatedAt: new Date().toISOString(),
        sentimentReason: "Radar is cooling down after a burst of requests. Showing deterministic fallback signals so the feed never goes blank.",
        signals: FALLBACK_RESPONSE.signals.map(enrichSignalNarrative),
      });
    }

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

    if (events.length === 0) {
      return Response.json({
        ...FALLBACK_RESPONSE,
        generatedAt: new Date().toISOString(),
        sourceStatus,
        signals: FALLBACK_RESPONSE.signals.map(enrichSignalNarrative),
      });
    }

    const candidates = normalizeEventsToSignals(events);
    const enriched = await enrichSignalsWithQuotes(candidates).catch(() => candidates);
    const topSignals = rankSignals(enriched, 8);

    const ai = await generateStructuredJSON<AiRadarPayload>(
      `Refine these radar signals from live data:
${JSON.stringify(
  topSignals.map((signal) => ({
    id: signal.id,
    type: signal.type,
    ticker: signal.ticker,
    companyName: signal.companyName,
    headline: signal.headline,
    conviction: signal.conviction,
    riskLevel: signal.riskLevel,
    currentPrice: signal.currentPrice,
    sources: signal.sources,
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
      "whySignal": string,
      "whyItMatters": string,
      "changeSummary": string,
      "catalysts": string[],
      "risks": string[],
      "conviction": "high" | "medium",
      "timeframe": string
    }
  ]
}`,
      SYSTEM
    );

    const aiById = new Map(ai.signals.map((signal) => [signal.id, signal]));
    const signals = topSignals.slice(0, 5).map((signal) => {
      const aiSignal = aiById.get(signal.id);
      return enrichSignalNarrative({
        ...signal,
        conviction: aiSignal?.conviction ?? signal.conviction,
        timeframe: aiSignal?.timeframe ?? signal.timeframe,
        reasoning: aiSignal?.reasoning ?? signal.reasoning,
        whySignal: aiSignal?.whySignal ?? signal.whySignal,
        whyItMatters: aiSignal?.whyItMatters ?? signal.whyItMatters,
        changeSummary: aiSignal?.changeSummary ?? signal.changeSummary,
        catalysts: aiSignal?.catalysts?.length ? aiSignal.catalysts : signal.catalysts,
        risks: aiSignal?.risks?.length ? aiSignal.risks : signal.risks,
      });
    });

    return Response.json({
      generatedAt: new Date().toISOString(),
      marketSentiment: ai.marketSentiment,
      sentimentReason: ai.sentimentReason,
      niftyOutlook: ai.niftyOutlook,
      topSector: ai.topSector,
      sourceStatus,
      signals,
    } satisfies RadarResponse);
  } catch (error) {
    console.error("Radar API failed:", error);
    return Response.json({
      ...FALLBACK_RESPONSE,
      generatedAt: new Date().toISOString(),
      signals: FALLBACK_RESPONSE.signals.map(enrichSignalNarrative),
    });
  }
}
