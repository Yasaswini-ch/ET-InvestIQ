import { OhlcvCandle } from "@/lib/types/market";

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function movingAverage(values: number[], window: number) {
  if (values.length < window) return null;
  return average(values.slice(values.length - window));
}

export function summarizeCandles(candles: OhlcvCandle[]) {
  if (candles.length < 3) {
    throw new Error("Not enough candles to summarize");
  }

  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const volumes = candles.map((c) => c.volume);

  const latest = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const sma20 = movingAverage(closes, 20);
  const sma50 = movingAverage(closes, 50);

  const recent20High = Math.max(...highs.slice(-20));
  const recent20Low = Math.min(...lows.slice(-20));
  const recent50High = Math.max(...highs.slice(-50));
  const recent50Low = Math.min(...lows.slice(-50));

  const avgVol20 = average(volumes.slice(-20));
  const volumeSpike = latest.volume > avgVol20 * 1.5;
  const changePercent = prev.close ? ((latest.close - prev.close) / prev.close) * 100 : 0;

  let trend: "bullish" | "neutral" | "bearish" = "neutral";
  if ((sma20 ?? latest.close) > (sma50 ?? latest.close) && latest.close > (sma20 ?? latest.close)) trend = "bullish";
  if ((sma20 ?? latest.close) < (sma50 ?? latest.close) && latest.close < (sma20 ?? latest.close)) trend = "bearish";

  const breakout = latest.close > recent20High * 0.995;
  const pullback = latest.close < recent20Low * 1.005;
  const patternWindowStart = candles[Math.max(0, candles.length - 20)]?.time ?? candles[0].time;
  const breakoutPoint = breakout || pullback ? latest.time : null;

  return {
    latestClose: latest.close,
    changePercent,
    supportZones: [recent20Low, recent50Low].map((v) => Number(v.toFixed(2))),
    resistanceZones: [recent20High, recent50High].map((v) => Number(v.toFixed(2))),
    volumeSpike,
    trend,
    breakoutPoint,
    patternWindow: {
      start: patternWindowStart,
      end: latest.time,
    },
    technicals: {
      sma20: sma20 ? Number(sma20.toFixed(2)) : null,
      sma50: sma50 ? Number(sma50.toFixed(2)) : null,
      breakout,
      pullback,
    },
  };
}
