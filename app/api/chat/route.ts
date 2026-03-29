import { rateLimit, getIP } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";
import { buildMarketContext } from "@/lib/chat/context";
import { buildSources } from "@/lib/chat/sources";
import { extractTickerFromText, pickRelevantSignals } from "@/lib/chat/tools";
import { fetchBseAnnouncements } from "@/lib/feeds/bse";
import { fetchNseBulkDeals } from "@/lib/feeds/nse";
import { fetchSebiFeed } from "@/lib/feeds/sebi";
import { generateChatJSON } from "@/lib/chat/llm";
import { enrichSignalsWithQuotes } from "@/lib/radar/enrich";
import { normalizeEventsToSignals } from "@/lib/radar/normalize";
import { rankSignals } from "@/lib/radar/scoring";
import { ChatReasoningStep, ChatRequestBody, ChatResponsePayload } from "@/lib/types/chat";
import { MarketSnapshot } from "@/lib/types/market";
import { RadarSignal } from "@/lib/types/radar";
import { getIndianMarketData, getStockQuote } from "@/lib/yfinance";

const SYSTEM = `You are ET Markets AI - India's smartest investment assistant.
Rules:
- Use the provided live market context and events first.
- Mention risk in every response.
- Do not tell the user to buy or sell immediately.
- Frame all output as informational, not investment advice.
- Keep the answer under 260 words.
- Use concise bullets when useful.
- Return JSON only:
{
  "answer": string,
  "suggested": string[],
  "reasoningSteps": [{ "label": string, "detail": string }]
}`;

const INJECTION_PATTERNS = [
  /ignore (all |previous |above )?instructions/i,
  /system prompt/i,
  /jailbreak/i,
  /you are now/i,
  /pretend you/i,
  /act as if/i,
];

function unwrapAnswerFromJsonBlock(text: string): string {
  const raw = text.trim();
  if (!raw) return raw;

  const deFenced = raw.replace(/```json\n?|\n?```/g, "").trim();

  const extractAnswerFromBrokenJson = (candidate: string): string | null => {
    const keyIndex = candidate.indexOf('"answer"');
    if (keyIndex === -1) return null;

    const colonIndex = candidate.indexOf(":", keyIndex);
    if (colonIndex === -1) return null;

    const firstQuoteIndex = candidate.indexOf('"', colonIndex);
    if (firstQuoteIndex === -1) return null;

    let index = firstQuoteIndex + 1;
    let escaped = false;
    let value = "";

    while (index < candidate.length) {
      const char = candidate[index];
      if (escaped) {
        value += char;
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        break;
      } else {
        value += char;
      }
      index += 1;
    }

    if (!value.trim()) return null;

    return value
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\t/g, " ")
      .trim();
  };

  const tryParse = (candidate: string): string | null => {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (typeof parsed === "string") {
        return unwrapAnswerFromJsonBlock(parsed);
      }
      const asObj = parsed as { answer?: unknown };
      if (typeof asObj.answer === "string" && asObj.answer.trim()) {
        return asObj.answer.trim();
      }
      return null;
    } catch {
      return null;
    }
  };

  const tryParseEscaped = (candidate: string): string | null => {
    try {
      const unescaped = candidate.replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\t/g, " ").trim();
      const parsed = JSON.parse(unescaped) as { answer?: unknown };
      if (typeof parsed.answer === "string" && parsed.answer.trim()) {
        return parsed.answer.trim();
      }
      return null;
    } catch {
      return null;
    }
  };

  const direct = tryParse(deFenced);
  if (direct) return direct;
  const escaped = tryParseEscaped(deFenced);
  if (escaped) return escaped;
  const broken = extractAnswerFromBrokenJson(deFenced);
  if (broken) return broken;

  const firstBrace = deFenced.indexOf("{");
  const lastBrace = deFenced.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const fragment = deFenced.slice(firstBrace, lastBrace + 1);
    const fromFragment = tryParse(fragment);
    if (fromFragment) return fromFragment;
    const fromEscapedFragment = tryParseEscaped(fragment);
    if (fromEscapedFragment) return fromEscapedFragment;
    const fromBrokenFragment = extractAnswerFromBrokenJson(fragment);
    if (fromBrokenFragment) return fromBrokenFragment;
  }

  return deFenced;
}

function formatMove(changePercent?: number | null) {
  if (typeof changePercent !== "number" || !Number.isFinite(changePercent)) return null;
  const direction = changePercent > 0 ? "up" : changePercent < 0 ? "down" : "flat";
  return `${Math.abs(changePercent).toFixed(2)}% ${direction}`;
}

function describeMarketMood(market: MarketSnapshot, signals: RadarSignal[]) {
  const niftyMove = formatMove(market.nifty?.changePercent);
  const sensexMove = formatMove(market.sensex?.changePercent);
  const topSignal = signals[0];

  const moodPieces: string[] = [];
  if (niftyMove || sensexMove) {
    moodPieces.push(
      `The market tone is ${
        niftyMove && sensexMove
          ? `Nifty ${niftyMove} and Sensex ${sensexMove}`
          : niftyMove
            ? `Nifty is ${niftyMove}`
            : `Sensex is ${sensexMove}`
      }.`
    );
  }

  if (topSignal) {
    moodPieces.push(
      `A watchpoint is ${topSignal.companyName} (${topSignal.ticker.replace(".NS", "")}) with ${topSignal.conviction} conviction and ${topSignal.timeframe} time frame.`
    );
  }

  if (!moodPieces.length) {
    moodPieces.push("Market mood looks mixed, so keep sizing disciplined and avoid chasing a single headline.");
  }

  return moodPieces.join(" ");
}

function makeSteps(...steps: ChatReasoningStep[]) {
  return steps;
}

function buildFallbackChatAnswer(latestUser: string, options: { ticker?: string | null; market: MarketSnapshot; signals: RadarSignal[] }) {
  const lower = latestUser.toLowerCase();
  const ticker = options.ticker;
  const mood = describeMarketMood(options.market, options.signals);

  if (lower.includes("buy") || lower.includes("hold") || lower.includes("wait")) {
    return {
      answer: `${mood} If you are deciding whether to buy, hold, or wait, prefer a staged approach: keep a cash buffer, add only if the thesis is clear, and avoid moving all at once on a single headline.`,
      suggested: ["What risk should I check first?", "How do I stage an entry?"],
      reasoningSteps: makeSteps(
        { label: "Market Context", detail: mood },
        { label: "Decision Lens", detail: "A staged entry reduces timing risk when the signal still needs confirmation." },
        { label: "Risk Check", detail: "Protect against headline-driven reversals by keeping cash buffer and position sizing disciplined." }
      ),
    };
  }

  if (lower.includes("market mood") || lower.includes("current market") || lower.includes("nifty")) {
    return {
      answer: `${mood} Stay selective, keep position sizes modest, and let price action confirm the thesis before adding risk.`,
      suggested: ["Which sectors look strongest?", "What should I avoid right now?"],
      reasoningSteps: makeSteps(
        { label: "Market Context", detail: mood },
        { label: "Interpretation", detail: "Index tone and top signals are mixed enough that confirmation matters more than speed." },
        { label: "Risk Check", detail: "Avoid oversizing until leadership and follow-through improve." }
      ),
    };
  }

  if (lower.includes("portfolio") || lower.includes("risk") || lower.includes("overlap")) {
    return {
      answer: "For portfolio risk, check three things first: concentration in one stock or sector, overlap across funds, and whether your cash buffer is large enough for the next 6 months. If one bucket is dominating, reduce size before adding new ideas.",
      suggested: ["How do I reduce overlap?", "What is a healthy portfolio split?"],
      reasoningSteps: makeSteps(
        { label: "Portfolio Lens", detail: "Concentration, overlap, and liquidity usually matter before stock selection tweaks." },
        { label: "Interpretation", detail: "A portfolio becomes fragile when one exposure can dominate outcomes." },
        { label: "Risk Check", detail: "Reduce oversized exposures before adding fresh risk." }
      ),
    };
  }

  if (lower.includes("fund") || lower.includes("large cap") || lower.includes("mutual fund")) {
    return {
      answer: "For large-cap fund research, focus on 3 things: low expense ratio, long-term consistency versus benchmark, and low overlap with the rest of your portfolio. If you want a shortlist, study index funds and stable flexi-cap funds before chasing short-term winners.",
      suggested: ["How do I compare large cap funds?", "What should I check before investing in a fund?"],
      reasoningSteps: makeSteps(
        { label: "Fund Lens", detail: "Cost, consistency, and overlap are usually more durable than recent outperformance." },
        { label: "Interpretation", detail: "A fund that duplicates existing holdings often adds less value than investors expect." },
        { label: "Risk Check", detail: "Avoid picking a fund only because of recent returns." }
      ),
    };
  }

  if (lower.includes("sip")) {
    return {
      answer: "If your emergency fund is in place and your cash flow is comfortable, increasing your SIP by 10% to 15% is a sensible long-term move. If money is tight, keep the SIP unchanged for now and revisit it after one or two months.",
      suggested: ["How should I size my SIP increase?", "What is the safest way to invest a bonus?"],
      reasoningSteps: makeSteps(
        { label: "Cash Flow Lens", detail: "SIP increases work best when emergency reserves and monthly cash flow are already healthy." },
        { label: "Interpretation", detail: "A moderate step-up is usually safer than a sudden large jump." },
        { label: "Risk Check", detail: "Do not stretch a SIP increase if it weakens your monthly buffer." }
      ),
    };
  }

  if (lower.includes("xirr")) {
    return {
      answer: "XIRR is the annualized return that accounts for when you invested and when you withdrew. It is usually more useful than simple CAGR for portfolios with multiple cash flows.",
      suggested: ["How is XIRR different from CAGR?", "Can you explain portfolio overlap?"],
      reasoningSteps: makeSteps(
        { label: "Definition", detail: "XIRR handles irregular cash flows, unlike CAGR." },
        { label: "Interpretation", detail: "It is the more relevant return measure for SIPs and portfolios with additions over time." },
        { label: "Risk Check", detail: "Do not compare XIRR directly with point-to-point returns without matching the cash-flow pattern." }
      ),
    };
  }

  if (lower.includes("budget") || lower.includes("tax")) {
    return {
      answer: "For Budget or tax changes, first separate noise from impact. Check whether the change affects equity, debt, or retirement savings, then estimate the rupee impact on your own holdings before making any move.",
      suggested: ["How does this affect my SIP?", "Should I change anything now?"],
      reasoningSteps: makeSteps(
        { label: "Policy Lens", detail: "Not every announcement creates a real portfolio impact." },
        { label: "Interpretation", detail: "The useful step is translating the rule into a rupee impact on your actual holdings." },
        { label: "Risk Check", detail: "Avoid changing allocations before the practical effect is clear." }
      ),
    };
  }

  if (lower.includes("sector") || lower.includes("industry")) {
    return {
      answer: `${mood} For sector questions, compare earnings momentum, valuation comfort, and capital allocation discipline. Strong sectors usually have both earnings support and reasonable expectations.`,
      suggested: ["Which sector is most defensive?", "Where is the risk highest?"],
      reasoningSteps: makeSteps(
        { label: "Market Context", detail: mood },
        { label: "Sector Lens", detail: "The best sectors typically combine earnings support with reasonable valuation expectations." },
        { label: "Risk Check", detail: "Avoid sectors where expectations are already too rich for the underlying earnings trend." }
      ),
    };
  }

  return {
    answer: `${mood}${ticker ? ` If you are focused on ${ticker}, keep the thesis simple and verify the quote before acting.` : " For any new position, size it slowly, keep a cash buffer, and verify the thesis before acting."}`,
    suggested: ["What is the current market mood?", "Should I buy, hold, or wait?"],
    reasoningSteps: makeSteps(
      { label: "Market Context", detail: mood },
      { label: "Interpretation", detail: ticker ? `${ticker} should be evaluated in the context of live price, signal flow, and portfolio fit.` : "The next step is to narrow the question into market, stock, or portfolio context." },
      { label: "Risk Check", detail: "Size gradually and verify the thesis before acting on a fresh signal." }
    ),
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
    const fallback = buildFallbackChatAnswer("market update", {
      ticker: null,
      market: { nifty: null, sensex: null, usdInr: null, gold: null },
      signals: [],
    });
    return NextResponse.json({
      answer: fallback.answer,
      suggested: fallback.suggested,
      sources: [],
      reasoningSteps: fallback.reasoningSteps,
    });
  }

  try {
    const body = (await req.json()) as ChatRequestBody;
    const maxMessageLength = 600;
    const maxMessages = 10;
    const rawMessages = body.messages || [];
    const messages = rawMessages.slice(-maxMessages).map((message) => ({
      role: message.role,
      content: String(message.content).slice(0, maxMessageLength),
    }));

    if (messages.some((message) => INJECTION_PATTERNS.some((pattern) => pattern.test(message.content)))) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }

    const latestUser = [...messages].reverse().find((message) => message.role === "user")?.content || "";
    const extractedTicker = body.focusTicker || extractTickerFromText(latestUser);

    const [market, signals, tickerQuote] = await Promise.all([
      safeMarketData(),
      loadSignals(),
      extractedTicker ? getStockQuote(extractedTicker).catch(() => null) : Promise.resolve(null),
    ]);

    const ticker = tickerQuote ? extractedTicker : null;
    const relevant = pickRelevantSignals(signals, latestUser);
    const context = buildMarketContext({
      market,
      portfolioContext: body.portfolioContext,
      signals: relevant.length ? relevant : signals.slice(0, 3),
    });

    let ai: { answer: string; suggested: string[]; reasoningSteps: ChatReasoningStep[] } | null = null;
    try {
      ai = await generateChatJSON(
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

    const fallback = buildFallbackChatAnswer(latestUser, { ticker, market, signals });
    let answer = ai?.answer?.trim() ? unwrapAnswerFromJsonBlock(ai.answer) : fallback.answer;
    answer = answer
      .replace(/\b(buy this now|sell this now|strong buy|strong sell)\b/gi, "review this carefully")
      .trim();
    if (body.portfolioContext && !/portfolio-aware/i.test(answer)) {
      answer = `${answer} This is portfolio-aware context based on your latest snapshot and may still be imperfect.`;
    }
    if (!/informational/i.test(answer) && !/not investment advice/i.test(answer)) {
      answer = `${answer} This is informational and not investment advice.`;
    }
    const suggested = Array.isArray(ai?.suggested) && ai.suggested.length > 0 ? ai.suggested : fallback.suggested;
    const reasoningSteps = Array.isArray(ai?.reasoningSteps) && ai.reasoningSteps.length > 0 ? ai.reasoningSteps.slice(0, 4) : fallback.reasoningSteps;

    const payload: ChatResponsePayload = {
      answer,
      suggested: suggested.slice(0, 2),
      sources: buildSources({
        market,
        signals: relevant.length ? relevant : signals,
        includePortfolio: Boolean(body.portfolioContext),
        ticker,
      }),
      reasoningSteps,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Chat API failed:", error);
    const fallback = buildFallbackChatAnswer("market update", {
      ticker: null,
      market: { nifty: null, sensex: null, usdInr: null, gold: null },
      signals: [],
    });
    return NextResponse.json(
      {
        answer: fallback.answer,
        suggested: fallback.suggested,
        sources: [],
        reasoningSteps: fallback.reasoningSteps,
      },
      { status: 200 }
    );
  }
}
