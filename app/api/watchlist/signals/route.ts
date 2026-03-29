import { NextRequest, NextResponse } from "next/server";
import { fetchBseAnnouncements } from "@/lib/feeds/bse";
import { fetchNseBulkDeals } from "@/lib/feeds/nse";
import { fetchSebiFeed } from "@/lib/feeds/sebi";
import { normalizeEventsToSignals } from "@/lib/radar/normalize";
import { rankSignals } from "@/lib/radar/scoring";
import { WatchlistSignalsResponse } from "@/lib/types/watchlist";
import { getStockQuote, normalizeNseTicker } from "@/lib/yfinance";

export const dynamic = "force-dynamic";

function formatSignalType(type: string): string {
  if (type === "bulk_deal") return "BULK DEAL";
  if (type === "regulatory") return "SEBI ALERT";
  return "BLOCK TRADE";
}

function convictionScore(value: "high" | "medium"): number {
  return value === "high" ? 82 : 64;
}

function buildFallbackResponse(symbols: string[]): WatchlistSignalsResponse {
  return {
    tickers: symbols.map((symbol, index) => ({
      symbol,
      price: 1000 + index * 125,
      change: index % 2 === 0 ? 12.4 : -8.7,
      changePercent: index % 2 === 0 ? 1.24 : -0.87,
      signals: [],
    })),
  };
}

export async function GET(req: NextRequest) {
  try {
    const raw = req.nextUrl.searchParams.get("tickers") ?? "";
    const symbols = raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 12);

    if (!symbols.length) {
      return NextResponse.json({ tickers: [] } satisfies WatchlistSignalsResponse);
    }

    const normalized = symbols.map((symbol) => normalizeNseTicker(symbol));
    const quotes = await Promise.all(normalized.map((symbol) => getStockQuote(symbol).catch(() => null)));

    try {
      const [bse, nse, sebi] = await Promise.all([
        fetchBseAnnouncements(),
        fetchNseBulkDeals(),
        fetchSebiFeed(),
      ]);

      const rankedSignals = rankSignals(normalizeEventsToSignals([...bse, ...nse, ...sebi]), 40);
      const signalMap = new Map<string, typeof rankedSignals>();

      for (const signal of rankedSignals) {
        const key = normalizeNseTicker(signal.ticker).replace(".NS", "");
        const current = signalMap.get(key) ?? [];
        current.push(signal);
        signalMap.set(key, current);
      }

      return NextResponse.json({
        tickers: normalized.map((symbol, index) => {
          const compactSymbol = symbol.replace(".NS", "");
          const matchedSignals = (signalMap.get(compactSymbol) ?? []).slice(0, 2);
          const quote = quotes[index];

          return {
            symbol: compactSymbol,
            price: Number((quote?.price ?? 0).toFixed(2)),
            change: Number((quote?.change ?? 0).toFixed(2)),
            changePercent: Number((quote?.changePercent ?? 0).toFixed(2)),
            signals: matchedSignals.map((signal) => ({
              type: formatSignalType(signal.type),
              conviction: convictionScore(signal.conviction),
              summary: signal.headline,
            })),
          };
        }),
      } satisfies WatchlistSignalsResponse);
    } catch {
      return NextResponse.json({
        tickers: normalized.map((symbol, index) => {
          const quote = quotes[index];
          return {
            symbol: symbol.replace(".NS", ""),
            price: Number((quote?.price ?? 0).toFixed(2)),
            change: Number((quote?.change ?? 0).toFixed(2)),
            changePercent: Number((quote?.changePercent ?? 0).toFixed(2)),
            signals: [],
          };
        }),
      } satisfies WatchlistSignalsResponse);
    }
  } catch (error) {
    console.error("Watchlist signals API failed:", error);
    const raw = req.nextUrl.searchParams.get("tickers") ?? "";
    const symbols = raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 12);

    return NextResponse.json(buildFallbackResponse(symbols));
  }
}

