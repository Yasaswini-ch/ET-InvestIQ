import { rateLimit, getIP } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { buildMarketContext } from "@/lib/chat/context";
import { buildSources } from "@/lib/chat/sources";
import { extractTickerFromText, pickRelevantSignals } from "@/lib/chat/tools";
import { fetchBseAnnouncements } from "@/lib/feeds/bse";
import { fetchNseBulkDeals } from "@/lib/feeds/nse";
import { fetchSebiFeed } from "@/lib/feeds/sebi";
import { generateStructuredJSON } from "@/lib/gemini";
import { enrichSignalsWithQuotes } from "@/lib/radar/enrich";
import { normalizeEventsToSignals } from "@/lib/radar/normalize";
import { rankSignals } from "@/lib/radar/scoring";
import { ChatRequestBody, ChatResponsePayload } from "@/lib/types/chat";
import { getIndianMarketData, getStockQuote } from "@/lib/yfinance";

const SYSTEM = `You are ET Markets AI - India's smartest investment assistant.
Rules:
- Use the provided live market context and events first.
- Mention risk in every response.
- Keep the answer under 260 words.
- Use concise bullets when useful.
- Return JSON only:
{
  "answer": string,
  "suggested": string[]
}`;

async function loadSignals() {
  try {
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
    const enriched = await enrichSignalsWithQuotes(normalized).catch(() => normalized);
    return rankSignals(enriched, 8);
  } catch {
    return [];
  }
}

async function safeMarketData() {
  try {
    return await getIndianMarketData();
  } catch {
    return { nifty: null, sensex: null, usdInr: null, gold: null };
  }
}

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  if (!rateLimit(ip, 5, 60_000)) {
    return Response.json(
      { error: "Too many requests. Please wait a minute." },
      { status: 429 }
    );
  }

  try {
    const body = (await req.json()) as ChatRequestBody;
    const MAX_MSG_LENGTH = 600;
    const MAX_MESSAGES = 10;
    const rawMessages = body.messages || [];
    const messages = rawMessages
      .slice(-MAX_MESSAGES)
      .map((m: any) => ({
        role: m.role,
        content: String(m.content).slice(0, MAX_MSG_LENGTH),
      }));
    const latestUser = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    const ticker = body.focusTicker || extractTickerFromText(latestUser);

    const [market, signals, tickerQuote] = await Promise.all([
      safeMarketData(),
      loadSignals(),
      ticker ? getStockQuote(ticker).catch(() => null) : Promise.resolve(null),
    ]);

    const relevant = pickRelevantSignals(signals, latestUser);
    const context = buildMarketContext({
      market,
      portfolioContext: body.portfolioContext,
      signals: relevant.length ? relevant : signals.slice(0, 3),
    });

    const ai = await generateStructuredJSON<{ answer: string; suggested: string[] }>(
      `User conversation:
${JSON.stringify(messages, null, 2)}

Live context:
${JSON.stringify(
  {
    ...context,
    focusTicker: ticker,
    focusTickerQuote: tickerQuote,
  },
  null,
  2
)}`,
      SYSTEM
    );

    const payload: ChatResponsePayload = {
      answer: ai.answer,
      suggested: Array.isArray(ai.suggested) ? ai.suggested.slice(0, 2) : [],
      sources: buildSources({
        market,
        signals: relevant.length ? relevant : signals,
        includePortfolio: Boolean(body.portfolioContext),
        ticker,
      }),
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Chat API failed:", error);
    return NextResponse.json(
      {
        answer: "I hit a temporary issue while fetching live context. Please retry in a few seconds.",
        suggested: ["Can you summarize today's market mood?", "What are the top risks right now?"],
        sources: [],
      },
      { status: 500 }
    );
  }
}
