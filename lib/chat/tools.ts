import { RadarSignal } from "@/lib/types/radar";

export function extractTickerFromText(input: string): string | null {
  const originalWords = input.match(/\b[\w.&/-]+\b/g) || [];
  const upper = input.toUpperCase();

  // Try to find an explicit .NS ticker first
  const explicitMatch = upper.match(/\b([A-Z0-9]{2,15}\.NS)\b/);
  if (explicitMatch) return explicitMatch[1];

  const knownNames = new Map<string, string>([
    ["RELIANCE", "RELIANCE.NS"],
    ["TCS", "TCS.NS"],
    ["INFOSYS", "INFY.NS"],
    ["HDFCBANK", "HDFCBANK.NS"],
    ["SBIN", "SBIN.NS"],
  ]);

  for (const word of originalWords) {
    const normalized = word.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    if (!normalized) continue;
    if (knownNames.has(normalized)) {
      return knownNames.get(normalized) ?? null;
    }
  }

  // Otherwise, find words that are likely tickers (all caps, 2-10 chars)
  const matches = originalWords
    .filter((word) => /^[A-Z0-9.&/-]{2,15}$/.test(word))
    .map((word) => word.replace(/[^A-Z0-9]/gi, ""));
  const commonWords = new Set([
    "THE", "AND", "FOR", "THAT", "THIS", "WHAT", "ABOUT", "WILL", "WITH", "HAVE",
    "NIFTY", "SENSEX", "INDIA", "MARKET", "MUTUAL", "FUNDS", "BANK", "STOCK",
    "TELL", "ME", "WHY", "HOW", "SHOW", "FIND", "VIEW", "LOOK", "CALL", "NEWS",
    "PRICE", "CHART", "DATA", "PLAN", "XRAY", "RADAR", "CHAT", "FEED", "HELP",
    "IS", "ARE", "WAS", "WERE", "AM", "BE", "BEEN", "BEING", "DO", "DOES", "DID",
    "CAN", "COULD", "SHOULD", "WOULD", "MAY", "MIGHT", "MUST", "OUGHT",
    "STRONG", "LARGE", "CAP", "FUND", "FUNDS", "STUDY", "NOW", "TODAY",
    "BEST", "GOOD", "BUY", "SELL", "HOLD", "WHAT", "ARE", "TOP", "STOCKS",
  ]);

  for (const token of matches) {
    if (!commonWords.has(token) && token.length >= 2 && token.length <= 10) {
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
