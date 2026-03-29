export interface WatchlistSignal {
  type: string;
  conviction: number;
  summary: string;
}

export interface WatchlistTicker {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  signals: WatchlistSignal[];
}

export interface WatchlistSignalsResponse {
  tickers: WatchlistTicker[];
}
