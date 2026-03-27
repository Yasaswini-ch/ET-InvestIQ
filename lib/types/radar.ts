export type RadarSignalType =
  | "bulk_deal"
  | "insider_buy"
  | "breakout"
  | "earnings_surprise"
  | "sector_rotation"
  | "regulatory";

export interface RadarSource {
  title: string;
  url: string;
  publisher: "BSE" | "NSE" | "SEBI" | "Yahoo";
  publishedAt?: string;
}

export interface RadarEvent {
  id: string;
  source: "BSE" | "NSE" | "SEBI";
  type: "filing" | "bulk_deal" | "regulatory";
  ticker?: string;
  companyName?: string;
  title: string;
  description?: string;
  url?: string;
  eventDate: string;
  metadata?: Record<string, unknown>;
}

export interface RadarSignal {
  id: string;
  type: RadarSignalType;
  ticker: string;
  companyName: string;
  sector?: string;
  headline: string;
  conviction: "high" | "medium";
  riskLevel: "low" | "medium" | "high";
  timeframe: string;
  currentPrice?: number;
  watchPrice?: number;
  targetPrice?: number;
  stopLoss?: number;
  reasoning: string;
  catalysts: string[];
  risks: string[];
  eventDate?: string;
  sourceType?: string;
  sources: RadarSource[];
}

export interface RadarResponse {
  generatedAt: string;
  marketSentiment: "bullish" | "neutral" | "bearish";
  sentimentReason: string;
  niftyOutlook: string;
  topSector: string;
  sourceStatus?: Record<string, "ok" | "partial" | "failed">;
  signals: RadarSignal[];
}
