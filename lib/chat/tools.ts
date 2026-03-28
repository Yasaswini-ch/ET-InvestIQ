import { RadarSignal } from "@/lib/types/radar";

export function extractTickerFromText(input: string): string | null {
  const lower = input.toLowerCase();
  const upper = input.toUpperCase();

  // Try to find an explicit .NS ticker first
  const explicitMatch = upper.match(/\b([A-Z0-9]{2,15}\.NS)\b/);
  if (explicitMatch) return explicitMatch[1];

  const phraseMatches: Array<[RegExp, string]> = [
    [/\bhdfc\s+bank\b/i, "HDFCBANK.NS"],
    [/\bhdfcbank\b/i, "HDFCBANK.NS"],
    [/\breliance\b/i, "RELIANCE.NS"],
    [/\btata\s+motors\b/i, "TATAMOTORS.NS"],
    [/\binfosys\b/i, "INFY.NS"],
    [/\bstate\s+bank\s+of\s+india\b/i, "SBIN.NS"],
    [/\bsbi\b/i, "SBIN.NS"],
    [/\byes\s+bank\b/i, "YESBANK.NS"],
    [/\byesbank\b/i, "YESBANK.NS"],
    [/\bsuzlon\b/i, "SUZLON.NS"],
    [/\bpaytm\b/i, "PAYTM.NS"],
  ];

  for (const [pattern, ticker] of phraseMatches) {
    if (pattern.test(lower)) {
      return ticker;
    }
  }

  const allowlistedSymbols = new Map<string, string>([
    ["RELIANCE", "RELIANCE.NS"],
    ["TCS", "TCS.NS"],
    ["INFY", "INFY.NS"],
    ["HDFCBANK", "HDFCBANK.NS"],
    ["SBIN", "SBIN.NS"],
    ["ITC", "ITC.NS"],
    ["LT", "LT.NS"],
    ["WIPRO", "WIPRO.NS"],
    ["ADANIENT", "ADANIENT.NS"],
    ["TATAMOTORS", "TATAMOTORS.NS"],
  ]);

  const tokens = input.match(/\b[A-Z]{2,15}\b/g) || [];
  for (const token of tokens) {
    const symbol = allowlistedSymbols.get(token);
    if (symbol) return symbol;
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
