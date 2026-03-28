import { OhlcvCandle } from "@/lib/types/market";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://finance.yahoo.com/",
  Origin: "https://finance.yahoo.com",
};

type ChartMeta = {
  regularMarketPrice?: number;
  previousClose?: number;
  chartPreviousClose?: number;
};

type QuoteSnapshot = {
  price: number;
  change: number;
  changePercent: number;
};

function safeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

async function fetchChart(symbol: string): Promise<QuoteSnapshot | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol
    )}?interval=1d&range=2d`;
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = (data?.chart?.result?.[0]?.meta ?? null) as ChartMeta | null;
    if (!meta) return null;

    const price = safeNumber(meta.regularMarketPrice ?? meta.previousClose);
    const prevClose = safeNumber(meta.chartPreviousClose ?? meta.previousClose);
    if (price == null || prevClose == null || prevClose === 0) return null;

    const change = price - prevClose;
    const changePercent = (change / prevClose) * 100;
    return { price, change, changePercent };
  } catch {
    return null;
  }
}

export function normalizeNseTicker(input: string): string {
  // Remove spaces, dots, and common suffixes
  let cleaned = input.trim().toUpperCase().replace(/\s+/g, "");
  
  if (!cleaned) return "RELIANCE.NS";

  // Common mapping for popular stocks (including shorthand/partial names)
  const mapping: Record<string, string> = {
    "HDFCBANK": "HDFCBANK",
    "HDFC": "HDFCBANK",
    "ICICIBANK": "ICICIBANK",
    "ICICI": "ICICIBANK",
    "RELIANCEINDUSTRIES": "RELIANCE",
    "RIL": "RELIANCE",
    "TCS": "TCS",
    "INFOSYS": "INFY",
    "INFY": "INFY",
    "KOTAKBANK": "KOTAKBANK",
    "KOTAK": "KOTAKBANK",
    "AXISBANK": "AXISBANK",
    "AXIS": "AXISBANK",
    "SBI": "SBIN",
    "STATEBANKOFINDIA": "SBIN",
    "TATAMOTORS": "TATAMOTORS",
    "TATA": "TATAMOTORS",
    "TATASTEEL": "TATASTEEL",
    "WIPRO": "WIPRO",
    "BHARTIAIRTEL": "BHARTIAIRTEL",
    "AIRTEL": "BHARTIAIRTEL",
    "BAJFINANCE": "BAJFINANCE",
    "BAJAJFINANCE": "BAJFINANCE",
    "MARUTI": "MARUTI",
    "MARUTISUZUKI": "MARUTI",
    "NESTLEIND": "NESTLEIND",
    "NESTLE": "NESTLEIND",
    "SUNPHARMA": "SUNPHARMA",
    "ULTRACEMCO": "ULTRACEMCO",
    "ASIAN": "ASIANPAINT",
    "ASIANPAINTS": "ASIANPAINT",
    "LT": "LT",
    "LARSEN": "LT",
    "ADANIPORTS": "ADANIPORTS",
    "ADANI": "ADANIPORTS",
    "ONGC": "ONGC",
    "NTPC": "NTPC",
    "POWERGRID": "POWERGRID",
    "TITAN": "TITAN",
    "HINDALCO": "HINDALCO",
    "BAJAJFINSERV": "BAJAJFINSV",
    "DRREDDY": "DRREDDY",
    "DIVISLAB": "DIVISLAB",
    "CIPLA": "CIPLA",
    "HCLTECH": "HCLTECH",
    "HCL": "HCLTECH",
    "TECHM": "TECHM",
    "JSWSTEEL": "JSWSTEEL",
    "JSW": "JSWSTEEL",
  };

  if (mapping[cleaned]) {
    cleaned = mapping[cleaned];
  }

  return cleaned.endsWith(".NS") ? cleaned : `${cleaned}.NS`;
}

export async function getHistoricalOHLCV(
  symbol: string,
  range = "6mo",
  interval = "1d"
): Promise<OhlcvCandle[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?interval=${encodeURIComponent(interval)}&range=${encodeURIComponent(range)}`;

  const res = await fetch(url, { headers: HEADERS, next: { revalidate: 300 } });
  if (!res.ok) {
    throw new Error(`Failed OHLCV fetch for ${symbol}`);
  }

  const data = await res.json();
  const result = data?.chart?.result?.[0];
  const timestamps: number[] = result?.timestamp ?? [];
  const quote = result?.indicators?.quote?.[0];
  if (!quote || timestamps.length === 0) return [];

  const candles: OhlcvCandle[] = [];
  for (let i = 0; i < timestamps.length; i += 1) {
    const open = safeNumber(quote.open?.[i]);
    const high = safeNumber(quote.high?.[i]);
    const low = safeNumber(quote.low?.[i]);
    const close = safeNumber(quote.close?.[i]);
    const volume = safeNumber(quote.volume?.[i]) ?? 0;
    if (open == null || high == null || low == null || close == null) continue;

    candles.push({
      time: new Date(timestamps[i] * 1000).toISOString(),
      open,
      high,
      low,
      close,
      volume,
    });
  }
  return candles;
}

export async function getIndianMarketData() {
  const [nifty, sensex, usdInr, gold] = await Promise.all([
    fetchChart("^NSEI"),
    fetchChart("^BSESN"),
    fetchChart("INR=X"),
    fetchChart("GC=F"),
  ]);
  return { nifty, sensex, usdInr, gold };
}

export async function getStockQuote(symbol: string) {
  return fetchChart(symbol);
}
