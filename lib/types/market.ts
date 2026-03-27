export interface QuoteSnapshot {
  price: number;
  change: number;
  changePercent: number;
  currency?: string;
  symbol?: string;
  asOf?: string;
}

export interface OhlcvCandle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketSnapshot {
  nifty: QuoteSnapshot | null;
  sensex: QuoteSnapshot | null;
  usdInr: QuoteSnapshot | null;
  gold: QuoteSnapshot | null;
}

export interface ChartPatternInsight {
  name: string;
  bias: "bullish" | "bearish" | "neutral";
  confidence: number;
  successRate: number;
  explanation: string;
  riskNote: string;
}

export interface ChartPatternResponse {
  ticker: string;
  range: string;
  interval: string;
  candles: OhlcvCandle[];
  summary: {
    latestClose: number;
    changePercent: number;
    supportZones: number[];
    resistanceZones: number[];
    volumeSpike: boolean;
    trend: "bullish" | "neutral" | "bearish";
    breakoutPoint?: string | null;
    patternWindow?: { start: string; end: string } | null;
  };
  patterns: ChartPatternInsight[];
  similarHistorical: string[];
  generatedAt: string;
}
