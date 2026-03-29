import { NextRequest, NextResponse } from "next/server";
import { fetchBseAnnouncements } from "@/lib/feeds/bse";
import { fetchNseBulkDeals } from "@/lib/feeds/nse";
import { fetchSebiFeed } from "@/lib/feeds/sebi";
import { generateStructuredJSON } from "@/lib/gemini";
import { getIP, rateLimit } from "@/lib/rateLimit";
import { normalizeEventsToSignals } from "@/lib/radar/normalize";
import { rankSignals } from "@/lib/radar/scoring";
import { MarketSnapshot } from "@/lib/types/market";
import { RadarSignal } from "@/lib/types/radar";
import { VideoBriefResponse, VideoTemplate } from "@/lib/types/video";
import { getIndianMarketData } from "@/lib/yfinance";

export const dynamic = "force-dynamic";

type AiVideoPayload = Omit<VideoBriefResponse, "generatedAt" | "fallbackUsed">;

const TEMPLATE_LABELS: Record<VideoTemplate, string> = {
  "daily-wrap": "Daily Market Wrap",
  "top-movers": "Top Movers",
  "sector-rotation": "Sector Rotation",
  "fii-dii-flow": "FII / DII Flow",
  "radar-alerts": "Radar Alerts of the Day",
};

const SYSTEM = `You generate concise, visually rich short-video briefs for Indian retail investors.
Return JSON only.
Each scene must feel like a screen in a 30 to 90 second market video.
Use concrete numbers where available.
Avoid hype. Stay crisp and broadcast-like.`;

function safeTemplate(value: unknown): VideoTemplate {
  if (
    value === "top-movers" ||
    value === "sector-rotation" ||
    value === "fii-dii-flow" ||
    value === "radar-alerts"
  ) {
    return value;
  }
  return "daily-wrap";
}

function safeDuration(value: unknown): number {
  const parsed = Number(value);
  if (parsed === 60 || parsed === 90) return parsed;
  return 45;
}

async function loadMarket(): Promise<MarketSnapshot> {
  try {
    return await getIndianMarketData();
  } catch {
    return { nifty: null, sensex: null, usdInr: null, gold: null };
  }
}

async function loadSignals(): Promise<RadarSignal[]> {
  try {
    const [bse, nse, sebi] = await Promise.allSettled([
      fetchBseAnnouncements(),
      fetchNseBulkDeals(),
      fetchSebiFeed(),
    ]);
    const events = [];
    if (bse.status === "fulfilled") events.push(...bse.value);
    if (nse.status === "fulfilled") events.push(...nse.value);
    if (sebi.status === "fulfilled") events.push(...sebi.value);
    if (!events.length) return [];
    return rankSignals(normalizeEventsToSignals(events), 6);
  } catch {
    return [];
  }
}

function formatPercent(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "n/a";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function buildFallbackBrief(template: VideoTemplate, duration: number, market: MarketSnapshot, signals: RadarSignal[]): VideoBriefResponse {
  const topSignals = signals.slice(0, 3);
  const title = `${TEMPLATE_LABELS[template]} | ET InvestIQ`;
  const niftyMove = formatPercent(market.nifty?.changePercent);
  const sensexMove = formatPercent(market.sensex?.changePercent);
  const leadSignal = topSignals[0];

  const baseScenes = [
    {
      id: "scene-1",
      headline: "Market pulse at a glance",
      bullet: `Nifty ${niftyMove} and Sensex ${sensexMove} set the tone for today's tape.`,
      visualAccent: "emerald",
      dataPoints: [
        `Nifty 50: ${niftyMove}`,
        `Sensex: ${sensexMove}`,
        `USD/INR: ${formatPercent(market.usdInr?.changePercent)}`,
      ],
      voiceover: `Quick market wrap: Nifty is ${niftyMove}, Sensex is ${sensexMove}, and traders are watching the next directional break.`,
      sourceLabel: "Yahoo Finance",
      durationSeconds: Math.max(10, Math.floor(duration / 3)),
      visualCue: "Animated index cards with ticker tape, gain-loss meter, and market-open motion background.",
    },
    {
      id: "scene-2",
      headline: leadSignal ? `${leadSignal.companyName} is on the radar` : "Signals are still active",
      bullet: leadSignal
        ? `${leadSignal.headline} with ${leadSignal.conviction} conviction over ${leadSignal.timeframe}.`
        : "Live feeds are delayed, so this fallback brief is using a stable market snapshot.",
      visualAccent: "amber",
      dataPoints: leadSignal
        ? [leadSignal.ticker, leadSignal.type.replace(/_/g, " "), `${leadSignal.conviction.toUpperCase()} conviction`]
        : ["Fallback mode", "Data delayed", "Stable summary"],
      voiceover: leadSignal
        ? `${leadSignal.companyName} is a signal to watch, with ${leadSignal.conviction} conviction and a ${leadSignal.timeframe} trading window.`
        : "Signals are delayed, so we are using a fallback market brief instead of leaving the video blank.",
      sourceLabel: leadSignal?.sources?.[0]?.publisher ?? "ET InvestIQ",
      durationSeconds: Math.max(10, Math.floor(duration / 3)),
      visualCue: leadSignal
        ? "Company spotlight card with conviction badge, source chip, and expanding radar rings."
        : "Fallback status frame with stable market snapshot cards and a delayed-data badge.",
    },
    {
      id: "scene-3",
      headline: "What investors should do next",
      bullet: "Stay selective, size positions gradually, and verify any event-driven move against broader market context.",
      visualAccent: "blue",
      dataPoints: [
        "Avoid chasing one candle",
        "Use signals as watchpoints",
        "Review portfolio exposure",
      ],
      voiceover: "The practical takeaway: stay selective, size positions gradually, and review any move against the rest of your portfolio.",
      sourceLabel: "ET InvestIQ",
      durationSeconds: Math.max(10, duration - Math.max(10, Math.floor(duration / 3)) * 2),
      visualCue: "Closing action frame with checklist tiles, soft spotlight gradient, and clear call-to-action panel.",
    },
  ];

  return {
    title,
    template,
    duration,
    hook: "Here is your AI-generated market brief in under a minute.",
    summary: "A browser-native short-video brief built from live market context and ranked signals.",
    scenes: baseScenes,
    cta: "Open Radar or Chat to dig deeper into the strongest signal.",
    sources: [
      { label: "Yahoo Finance" },
      { label: "NSE Bulk Deals", url: "https://www.nseindia.com/report-detail/display-bulk-and-block-deals" },
      { label: "BSE Announcements", url: "https://www.bseindia.com/corporates/ann.html" },
    ],
    generatedAt: new Date().toISOString(),
    fallbackUsed: true,
  };
}

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  if (!rateLimit(ip, 4, 60_000)) {
    const market = await loadMarket();
    const signals = await loadSignals();
    return NextResponse.json(buildFallbackBrief("daily-wrap", 45, market, signals));
  }

  let template: VideoTemplate = "daily-wrap";
  let duration = 45;

  try {
    const body = (await req.json().catch(() => ({}))) as { template?: unknown; duration?: unknown };
    template = safeTemplate(body.template);
    duration = safeDuration(body.duration);

    const [market, signals] = await Promise.all([loadMarket(), loadSignals()]);
    const fallback = buildFallbackBrief(template, duration, market, signals);

    try {
      const payload = await generateStructuredJSON<AiVideoPayload>(
        `Build a ${duration}-second ${TEMPLATE_LABELS[template]} short-market-video plan for Indian retail investors.

Return this JSON shape:
{
  "title": string,
  "template": "${template}",
  "duration": ${duration},
  "hook": string,
  "summary": string,
  "scenes": [
    {
      "id": string,
      "headline": string,
      "bullet": string,
      "visualAccent": string,
      "dataPoints": string[],
      "voiceover": string,
      "sourceLabel": string,
      "durationSeconds": number,
      "visualCue": string
    }
  ],
  "cta": string,
  "sources": [
    { "label": string, "url": string }
  ]
}

Use 3 to 5 scenes only.
The sum of all durationSeconds should equal ${duration}.
Each visualCue should describe the exact on-screen treatment in one sentence.
Context:
${JSON.stringify(
  {
    market,
    topSignals: signals.slice(0, 4).map((signal) => ({
      ticker: signal.ticker,
      companyName: signal.companyName,
      headline: signal.headline,
      conviction: signal.conviction,
      timeframe: signal.timeframe,
      source: signal.sources?.[0]?.publisher,
    })),
  },
  null,
  2
)}`,
        SYSTEM
      );

      return NextResponse.json({
        ...payload,
        generatedAt: new Date().toISOString(),
        fallbackUsed: false,
      } satisfies VideoBriefResponse);
    } catch (error) {
      console.error("Video engine AI fallback used:", error);
      return NextResponse.json(fallback);
    }
  } catch (error) {
    console.error("Video API failed:", error);
    const market = await loadMarket();
    const signals = await loadSignals();
    return NextResponse.json(buildFallbackBrief(template, duration, market, signals));
  }
}
