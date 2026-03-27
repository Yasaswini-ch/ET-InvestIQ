import { RadarSignal } from "@/lib/types/radar";

export function extractTickerFromText(input: string): string | null {
  const upper = input.toUpperCase();
  
  // Try to find an explicit .NS ticker first
  const explicitMatch = upper.match(/\b([A-Z0-9]{2,15}\.NS)\b/);
  if (explicitMatch) return explicitMatch[1];

  // Otherwise, find words that are likely tickers (all caps, 2-10 chars)
  const matches = upper.matchAll(/\b([A-Z0-9]{2,15})\b/g);
  const commonWords = new Set([
    "THE", "AND", "FOR", "THAT", "THIS", "WHAT", "ABOUT", "WILL", "WITH", "HAVE",
    "NIFTY", "SENSEX", "INDIA", "MARKET", "MUTUAL", "FUNDS", "BANK", "STOCK",
    "TELL", "ME", "WHY", "HOW", "SHOW", "FIND", "VIEW", "LOOK", "CALL", "NEWS",
    "PRICE", "CHART", "DATA", "PLAN", "XRAY", "RADAR", "CHAT", "FEED", "HELP",
    "IS", "ARE", "WAS", "WERE", "AM", "BE", "BEEN", "BEING", "DO", "DOES", "DID",
    "CAN", "COULD", "SHOULD", "WOULD", "MAY", "MIGHT", "MUST", "OUGHT"
  ]);

  for (const match of matches) {
    const token = match[1];
    if (!commonWords.has(token) && token.length >= 2) {
      // Return the first non-common word as a .NS ticker
      return `${token}.NS`;
    }
  }

  return null;
}

export function pickRelevantSignals(signals: RadarSignal[], message: string) {
  const lower = message.toLowerCase();
  return signals.filter((s) => {
    const ticker = s.ticker.toLowerCase();
    const name = s.companyName.toLowerCase();
    return lower.includes(ticker.replace(".ns", "")) || lower.includes(name) || lower.includes(s.type.replace("_", " "));
  });
}
