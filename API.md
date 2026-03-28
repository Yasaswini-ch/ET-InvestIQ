# ET InvestIQ API Reference

This document provides a technical overview of the APIs powering ET InvestIQ.

---

### `POST /api/xray`
Analyzes a CAS PDF portfolio statement.
- **Body:** `multipart/form-data` (`pdf` or `useSample=true`)
- **Returns:** Health score, fund analytics, overlap matrix, AI rebalancing plan.

### `GET /api/radar`
Returns live market signals enriched with AI reasoning from BSE, NSE, and SEBI feeds.
- **Returns:** Market sentiment, ranked signals, conviction scores.

### `POST /api/chat`
Context-aware AI assistant for Indian markets.
- **Body:** `{ messages, portfolioContext?, focusTicker? }`
- **Returns:** Cited AI answer, follow-up suggestions, source list.

### `GET /api/charts`
Fetches OHLCV data + AI technical pattern detection.
- **Params:** `ticker`, `range`, `interval`
- **Returns:** Candle data, support/resistance, AI pattern insights.

### `GET /api/market`
Live Nifty/Sensex/Gold snapshot from Yahoo Finance.

---
*Back to [README.md](./README.md)*
