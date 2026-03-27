import { RadarSignal } from "@/lib/types/radar";
import { getStockQuote } from "@/lib/yfinance";

export async function enrichSignalsWithQuotes(signals: RadarSignal[]) {
  const enriched = await Promise.all(
    signals.map(async (signal) => {
      const quote = signal.ticker ? await getStockQuote(signal.ticker) : null;
      if (!quote) return signal;

      const currentPrice = Number(quote.price.toFixed(2));
      const watchPrice = Number((currentPrice * 0.995).toFixed(2));
      const targetPrice = Number((currentPrice * (signal.conviction === "high" ? 1.08 : 1.05)).toFixed(2));
      const stopLoss = Number((currentPrice * 0.96).toFixed(2));

      return {
        ...signal,
        currentPrice,
        watchPrice,
        targetPrice,
        stopLoss,
      };
    })
  );

  return enriched;
}
