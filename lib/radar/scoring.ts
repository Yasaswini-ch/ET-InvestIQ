import { RadarSignal } from "@/lib/types/radar";

export function calculateSignalScore(signal: RadarSignal) {
  let score = 35;
  if (signal.conviction === "high") score += 30;
  if (signal.riskLevel === "low") score += 12;
  if (signal.riskLevel === "high") score -= 10;
  if (signal.type === "bulk_deal") score += 20;
  if (signal.type === "insider_buy") score += 15;
  if (signal.type === "earnings_surprise") score += 18;
  if (signal.type === "breakout") score += 16;
  if (signal.type === "sector_rotation") score += 12;
  if (signal.type === "regulatory") score += 10;
  if (signal.currentPrice && signal.targetPrice && signal.currentPrice > 0) {
    score += ((signal.targetPrice - signal.currentPrice) / signal.currentPrice) * 100;
  }
  return Math.max(5, Math.min(98, Math.round(score)));
}

export function rankSignals(signals: RadarSignal[], limit = 8) {
  return [...signals]
    .sort((a, b) => calculateSignalScore(b) - calculateSignalScore(a))
    .slice(0, limit);
}
