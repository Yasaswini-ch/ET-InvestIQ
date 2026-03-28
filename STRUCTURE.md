# ET InvestIQ Project Structure

```
app/
  page.tsx                 # Landing page (dark, standalone)
  layout.tsx               # Root layout — fonts + AppShell
  globals.css              # Tailwind + liquid-glass utilities + animations
  api/
    xray/route.ts          # POST — parse CAS PDF + Gemini analysis
    radar/route.ts         # GET — BSE/NSE/SEBI feeds → AI signals
    chat/route.ts          # POST — market context + Gemini chat
    charts/route.ts        # GET — OHLCV + AI pattern detection
    market/route.ts        # GET — Nifty/Sensex snapshot
  xray/page.tsx
  radar/page.tsx
  chat/page.tsx
  charts/page.tsx
  newbies/page.tsx
  help/page.tsx

components/
  AppShell.tsx             # Fixed dark navbar + content wrapper
  PageHeader.tsx           # Page title + action slot
  MetricCard.tsx           # Animated counter card
  HealthScoreRing.tsx      # SVG ring with score animation
  SignalCard.tsx           # Radar signal with expand/watchlist
  RebalancingPlan.tsx      # Typewriter plan with urgency badge
  FundDetailsTable.tsx     # Per-fund metrics table
  OverlapHeatmap.tsx       # Animated fund overlap matrix
  AllocationPieChart.tsx   # Recharts pie (allocation by category)
  FundXIRRBarChart.tsx     # Recharts horizontal bar (per-fund XIRR)
  charts/
    OhlcvChart.tsx         # Lightweight Charts candlestick + volume
    TickerSearch.tsx       # NSE ticker input + analyze button
    PatternSummaryCard.tsx # AI pattern name + confidence + risk
    PatternStatsCard.tsx   # Close/change/support/resistance grid

lib/
  gemini.ts                # Gemini client + generateStructuredJSON
  yfinance.ts              # Yahoo Finance OHLCV + quote fetch
  chart-analysis.ts        # Local OHLCV summary (support/resistance/trend)
  samplePortfolio.ts       # Pre-loaded demo portfolio data
  feeds/
    bse.ts                 # BSE announcements HTML scraper
    nse.ts                 # NSE bulk deals JSON/CSV fetcher
    sebi.ts                # SEBI RSS XML parser
  radar/
    normalize.ts           # Events → typed RadarSignal
    enrich.ts              # Add live quote prices to signals
    scoring.ts             # Rank signals by conviction score
  chat/
    context.ts             # Build structured market context block
    sources.ts             # Build citation source list
    tools.ts               # Extract ticker, pick relevant signals
  types/
    market.ts
    radar.ts
    chat.ts
```

---
*Back to [README.md](./README.md)*
