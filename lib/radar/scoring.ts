import { RadarSignal } from "@/lib/types/radar";

function scoreSignal(signal: RadarSignal) {
  let score = 0;
  if (signal.conviction === "high") score += 30;
  if (signal.type === "bulk_deal") score += 20;
  if (signal.type === "insider_buy") score += 15;
  if (signal.type === "regulatory") score += 10;
  if (signal.currentPrice && signal.targetPrice && signal.currentPrice > 0) {
    score += ((signal.targetPrice - signal.currentPrice) / signal.currentPrice) * 100;
  }
  return score;
}

export function rankSignals(signals: RadarSignal[], limit = 8) {
  return [...signals].sort((a, b) => scoreSignal(b) - scoreSignal(a)).slice(0, limit);
}
