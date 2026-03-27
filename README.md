# ET InvestIQ

**AI-powered investment intelligence for Indian retail investors.**

Built with Next.js 14, TypeScript, Tailwind CSS, and Google Gemini. Five tools in one platform — portfolio diagnostics, opportunity signals, market chat, chart pattern analysis, and beginner education. No account needed to demo.

---

## Live at a Glance

| Route | Tool | Description |
|---|---|---|
| `/` | Landing Page | Dark glass-morphism homepage with feature overview |
| `/xray` | Portfolio X-Ray | Upload CAS PDF → AI health score, XIRR, overlap, rebalancing |
| `/radar` | Opportunity Radar | BSE + NSE + SEBI feeds → AI-ranked signals with conviction |
| `/chat` | Market Intelligence | Live market context + portfolio awareness + cited AI answers |
| `/charts` | Chart Intelligence | Real OHLCV from Yahoo Finance + AI pattern detection |
| `/newbies` | Newbie Corner | Flip-card learning + daily market challenge with streaks |
| `/help` | Help | Quick links to key features |

---

## The Five Tools

### 1. Portfolio X-Ray — `/xray`

Upload your CAS PDF (CAMS or KFintech) or use the pre-loaded sample portfolio.

**What you get:**
- **Health Score** (0–100) — weighted composite of XIRR, overlap, expense ratio, and risk
- **XIRR per fund** — actual annualized return on your irregular cash flows
- **Expense drag** — how much you are bleeding in annual fees
- **Overlap heatmap** — which funds hold the same stocks (red = dangerous overlap)
- **AI rebalancing plan** — typed-out action steps with urgency level and expected savings
- **Fund details table** — per-fund metrics with hold/increase/reduce/exit recommendations

All analysis runs through Google Gemini with your extracted portfolio as context.

---

### 2. Opportunity Radar — `/radar`

Pulls live signals from three Indian market sources and enriches them with AI reasoning.

**Data sources:**
- **BSE** — corporate announcements page (HTML scrape)
- **NSE** — bulk deal archives (JSON API with CSV fallback)
- **SEBI** — official RSS feed (`sebirss.xml`)

**Pipeline:**
1. Fetch all three in parallel via `Promise.allSettled`
2. Normalize raw events into typed radar signals
3. Enrich each signal with live Yahoo Finance quote data (price, target, stop-loss)
4. Rank by conviction score
5. Pass top 8 to Gemini for reasoning, catalysts, risks, and market sentiment summary

**Fallback:** When live feeds are unavailable (network block/throttle), the API returns five curated signals with realistic data so the page never crashes.

**UI features:** Search, filter by conviction/type, watchlist (localStorage), per-signal expandable detail.

---

### 3. Market Intelligence Chat — `/chat`

A context-aware AI assistant for Indian markets.

**Before answering, the server:**
1. Fetches live Nifty/Sensex/USD-INR/Gold from Yahoo Finance
2. Loads and ranks live radar signals (with graceful fallback if feeds are down)
3. Pulls portfolio context from `/xray` if the user ran an analysis (stored in localStorage)
4. Feeds all of this as a structured context block to Gemini

**Response includes:**
- Answer (under 260 words, with risk mention)
- Two follow-up question suggestions
- Source citations (market feed, radar signals, portfolio if applicable)

All feed failures are handled gracefully — chat always responds.

---

### 4. Chart Pattern Intelligence — `/charts`

Enter any NSE ticker and get a full technical analysis with AI interpretation.

**Flow:**
1. Normalize ticker (e.g. `HDFC BANK` → `HDFCBANK.NS`, `SBI` → `SBIN.NS`)
2. Fetch historical OHLCV candles from Yahoo Finance v8 API
3. Compute technical summary locally: support/resistance zones, trend, volume spike, pattern window
4. Pass summary to Gemini which returns 1–3 pattern insights with bias, confidence %, and estimated success rate
5. Render interactive candlestick + volume chart using **Lightweight Charts** (dark theme)

**Chart features:**
- Candlestick series (green/red) + volume histogram overlay
- Support lines (green dashed) and resistance lines (red dashed)
- Breakout marker (arrow up) if detected
- Pattern zone highlight overlay

**Range options:** 1mo, 3mo, 6mo, 1y

---

### 5. Newbie Corner — `/newbies`

Interactive financial education built for first-time investors.

**Learning cards (flip to reveal):**
- Market Basics — what moves stock prices
- Risk 101 — position sizing and concentration
- Entry/Exit — avoiding emotional decisions
- Common Mistakes — the errors that destroy beginners

Each card shows a question on the front, an explanation on the back, and one immediate action to take today.

**Daily Challenge:**
- One market scenario question per day, adapted to live Nifty movement
- Correct answer builds your streak (tracked in localStorage)
- Progress tracker: concepts learned / 20 goal

---

## UI Design

All pages use a unified dark glass-morphism design system:

- **Background:** pure black (`#000000`)
- **Cards:** `liquid-glass` — backdrop blur + subtle gradient border
- **Primary font:** Instrument Serif (italic headings)
- **Body font:** Barlow (light/regular/medium)
- **Accent:** Emerald green for signals, status, success states
- **Semantic colors:** Red (danger), Yellow (warning), Blue (info) — all in dark variants (`bg-*/10`)
- **Navbar:** Fixed top — ET InvestIQ logo + nav pills + Launch App CTA

The home page is a standalone marketing landing page with animated hero, feature walkthroughs, stats, and testimonials. Feature pages share the AppShell navbar.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, server components + client islands) |
| Language | TypeScript |
| Styling | Tailwind CSS + custom `liquid-glass` utilities |
| Animation | Framer Motion |
| AI | Google Gemini via `@google/genai` — model: `gemini-2.5-flash-lite` |
| Charts | Lightweight Charts (OHLCV), Recharts (pie + bar) |
| Market Data | Yahoo Finance v8 API (OHLCV, quotes, indices) |
| PDF Parsing | `pdf-parse` |
| Feed Parsing | `fast-xml-parser` (SEBI RSS), `papaparse` (NSE CSV) |
| Fonts | Instrument Serif, Barlow, Syne, DM Sans (via `next/font/google`) |

---

## Project Structure

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

## Getting Started

### Prerequisites

- Node.js 18+
- A Google Gemini API key (free tier works — [get one here](https://aistudio.google.com/app/apikey))

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/etgenai.git
cd etgenai

# Install dependencies
npm install
```

### Environment

Create a `.env.local` file in the project root:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### Run

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000).

---

## API Reference

### `POST /api/xray`

Analyzes a CAS PDF portfolio statement.

**Body:** `multipart/form-data`
- `pdf` — CAS PDF file
- `useSample=true` — use the built-in sample portfolio (no file needed)

**Response:** Full portfolio analysis object with health score, funds array, insights, overlap matrix, and rebalancing plan.

---

### `GET /api/radar`

Returns live market signals enriched with AI reasoning.

**Response:**
```json
{
  "generatedAt": "ISO timestamp",
  "marketSentiment": "bullish | neutral | bearish",
  "sentimentReason": "string",
  "niftyOutlook": "string",
  "topSector": "string",
  "sourceStatus": { "bse": "ok | partial | failed", "nse": "...", "sebi": "..." },
  "signals": [ /* RadarSignal[] */ ]
}
```

Falls back to curated signals if all live feeds are unavailable.

---

### `POST /api/chat`

Returns an AI answer with live market context.

**Body:**
```json
{
  "messages": [{ "role": "user | assistant", "content": "string" }],
  "portfolioContext": { /* optional — from /xray session */ },
  "focusTicker": "RELIANCE (optional)"
}
```

**Response:**
```json
{
  "answer": "string",
  "suggested": ["follow-up 1", "follow-up 2"],
  "sources": [ /* ChatSource[] */ ]
}
```

---

### `GET /api/charts?ticker=RELIANCE&range=6mo&interval=1d`

Fetches OHLCV data and runs AI pattern detection.

**Params:** `ticker`, `range` (1mo/3mo/6mo/1y), `interval` (1d/1wk)

**Response:** Candles array + summary (support/resistance/trend) + AI patterns + similar historical references.

---

### `GET /api/market`

Returns a live Nifty/Sensex/USD-INR/Gold snapshot from Yahoo Finance.

---

## Resilience Notes

- **Radar:** BSE, NSE, and SEBI feeds can be intermittently throttled. The API uses `Promise.allSettled` so partial failures are handled. If all three fail, curated fallback signals are served — the UI never crashes.
- **Chat:** All external data (market, feeds, stock quotes) are wrapped in try/catch. If live context fails, Gemini still answers using its training knowledge, and the response is returned normally.
- **Charts:** Yahoo Finance v8 API is generally stable. Requires at least 30 candles for analysis — tickers with insufficient history return a 422 with a clear message.
- **X-Ray:** PDF parsing can fail on non-standard CAS formats. Use the sample portfolio button to verify the analysis pipeline independently.

---

## Known Limitations

- NSE/BSE requests are made server-side — they may be blocked by exchange firewalls in some cloud hosting environments. Self-hosted or local dev works best.
- Chart pattern success rates are AI-estimated probabilities, not backtested guarantees.
- This platform is **not SEBI registered** and does not constitute financial advice.

---

## Roadmap

- Feed-level Redis caching + retry backoff for BSE/NSE/SEBI
- User accounts + persistent watchlists + email/Telegram alerts
- Portfolio drift alerts and monthly AI review summaries
- WhatsApp bot integration for radar signals
- NSE option chain overlay on charts

---

## Demo Flow (Hackathon / Presentation)

Start here for maximum impact:

1. **`/xray`** — Load sample portfolio. Walk through health score → overlap heatmap → AI rebalancing plan.
2. **`/radar`** — Show live signals, filter by HIGH conviction, expand one signal for full reasoning.
3. **`/chat`** — Ask "Should I hold HDFC Bank?" — show how portfolio context flows into the answer.
4. **`/charts`** — Search RELIANCE, select 6mo, click Analyze — show candlestick + AI patterns.
5. **`/newbies`** — Answer the daily challenge, flip a card — show the education layer.

---

*© 2026 ET InvestIQ — For informational and educational use only. Not SEBI registered.*
