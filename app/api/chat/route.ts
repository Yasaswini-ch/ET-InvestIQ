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

const INJECTION_PATTERNS = [
  /ignore (all |previous |above )?instructions/i,
  /system prompt/i,
  /jailbreak/i,
  /you are now/i,
  /pretend you/i,
  /act as if/i,
];

function buildFallbackChatAnswer(latestUser: string, ticker?: string | null) {
  const lower = latestUser.toLowerCase();
  if (lower.includes("sip")) {
    return {
      answer:
        "If your emergency fund is in place and your cash flow is comfortable, increasing your SIP by 10% to 15% is a sensible long-term move. If money is tight, keep the SIP unchanged for now and revisit it after one or two months.",
      suggested: [
        "How should I size my SIP increase?",
        "What is the safest way to invest a bonus?",
      ],
    };
  }

  if (lower.includes("xirr")) {
    return {
      answer:
        "XIRR is the annualized return that accounts for when you invested and when you withdrew. It is usually more useful than simple CAGR for portfolios with multiple cash flows.",
      suggested: [
        "How is XIRR different from CAGR?",
        "Can you explain portfolio overlap?",
      ],
    };
  }

  const focus = ticker ? ` for ${ticker}` : "";
  return {
    answer:
      `I am having a temporary issue pulling live market context${focus}. For now, keep decisions conservative: verify the thesis, check your cash buffer, and avoid acting on a single headline.`,
    suggested: [
      "What is the current market mood?",
      "Should I buy, hold, or wait?",
    ],
  };
}

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
    const messages = rawMessages.slice(-MAX_MESSAGES).map((message) => ({
      role: message.role,
      content: String(message.content).slice(0, MAX_MSG_LENGTH),
    }));

    if (
      messages.some((message) =>
        INJECTION_PATTERNS.some((pattern) => pattern.test(message.content))
      )
    ) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }
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

    let ai: { answer: string; suggested: string[] } | null = null;
    try {
      ai = await generateStructuredJSON<{ answer: string; suggested: string[] }>(
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
    } catch (error) {
      console.warn("Chat model fallback engaged:", error);
    }

    const fallback = buildFallbackChatAnswer(latestUser, ticker);
    const answer = ai?.answer?.trim() ? ai.answer : fallback.answer;
    const suggested = Array.isArray(ai?.suggested) && ai?.suggested.length > 0 ? ai.suggested : fallback.suggested;

    const payload: ChatResponsePayload = {
      answer,
      suggested: suggested.slice(0, 2),
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
    const fallback = buildFallbackChatAnswer("market update");
    return NextResponse.json(
      {
        answer: fallback.answer,
        suggested: fallback.suggested,
        sources: [],
      },
      { status: 200 }
    );
  }
}
