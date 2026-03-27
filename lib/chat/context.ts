import { MarketSnapshot } from "@/lib/types/market";
import { PortfolioChatContext } from "@/lib/types/chat";
import { RadarSignal } from "@/lib/types/radar";

export function buildMarketContext({
  market,
  portfolioContext,
  signals,
}: {
  market: MarketSnapshot;
  portfolioContext?: PortfolioChatContext | null;
  signals: RadarSignal[];
}) {
  return {
    liveMarket: {
      nifty: market.nifty,
      sensex: market.sensex,
    },
    portfolioContext: portfolioContext || null,
    relevantSignals: signals.slice(0, 5).map((s) => ({
      ticker: s.ticker,
      type: s.type,
      headline: s.headline,
      conviction: s.conviction,
      source: s.sources?.[0]?.publisher,
      sourceUrl: s.sources?.[0]?.url,
    })),
  };
}
