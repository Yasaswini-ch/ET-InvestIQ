import { ChatSource } from "@/lib/types/chat";
import { MarketSnapshot } from "@/lib/types/market";
import { RadarSignal } from "@/lib/types/radar";

export function buildSources({
  market,
  signals,
  includePortfolio,
  ticker,
}: {
  market: MarketSnapshot;
  signals: RadarSignal[];
  includePortfolio: boolean;
  ticker?: string | null;
}): ChatSource[] {
  const sources: ChatSource[] = [
    {
      title: "Yahoo Finance - Live Nifty / Sensex snapshot",
      publisher: "Yahoo",
      type: "market",
    },
  ];

  if (ticker) {
    sources.push({
      title: `Yahoo Finance - ${ticker} quote`,
      publisher: "Yahoo",
      type: "price",
    });
  }

  for (const signal of signals.slice(0, 3)) {
    const src = signal.sources?.[0];
    if (!src) continue;
    sources.push({
      title: src.title,
      url: src.url,
      publisher: src.publisher,
      type: src.publisher === "SEBI" ? "regulatory" : "radar",
    });
  }

  if (includePortfolio) {
    sources.push({
      title: "Portfolio X-Ray context from latest analysis",
      type: "portfolio",
      publisher: "ET InvestIQ",
    });
  }

  return sources;
}
