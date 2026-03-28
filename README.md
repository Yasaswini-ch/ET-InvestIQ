# ET InvestIQ

14 crore Indian demat accounts. Zero tools that connect what's happening in the market to what's happening in their portfolio. ET InvestIQ fixes that.

ET InvestIQ is an AI-powered investment intelligence platform for Indian retail investors. It combines portfolio diagnostics, live market context, signal detection, behavioral coaching, scam screening, and daily briefings into one product experience.

Built with Next.js 14, TypeScript, Tailwind CSS, Framer Motion, and Google Gemini.

## Overview

The platform is designed to help investors move from fragmented information to actionable decisions. It blends live market data, portfolio context, and AI-generated analysis across multiple workflows:

- Portfolio review and rebalancing
- Live opportunity tracking
- Market Q&A with portfolio-aware context
- Chart pattern analysis
- Scam detection for suspicious messages
- SIP and behavioral investing support
- Daily executive briefings
- A persistent AI assistant drawer available from every page

## Key Routes

| Route | Product Area | Description |
|---|---|---|
| `/` | Landing page | Product overview and feature navigation |
| `/xray` | Portfolio X-Ray | Upload a CAS statement for portfolio health, overlap, and rebalancing analysis |
| `/radar` | Opportunity Radar | Live BSE, NSE, and SEBI signal tracking with AI enrichment |
| Floating tab | Persistent AI Assistant | Always-available market and portfolio assistant accessible from every page |
| `/charts` | Chart Intelligence | OHLCV analysis and AI pattern detection for NSE tickers |
| `/scamcheck` | Scam Shield | Scam screening for suspicious investment messages |
| `/sip` | SIP Tools | SIP Time Machine, Goal Calculator, Portfolio Stress Test, and crash history guidance |
| `/briefing` | My Briefing | Daily briefing that connects your portfolio and market context |
| `/newbies` | Newbie Corner | Five-module learning platform with flip cards, progress tracking, and daily challenges |

## Core Capabilities

### Portfolio X-Ray

Upload a CAS PDF from CAMS or KFintech and get a structured portfolio analysis.

Includes:
- Portfolio health score
- Fund-level XIRR
- Expense drag
- Overlap heatmap
- Rebalancing recommendations
- Fund-level action table

### Opportunity Radar

Tracks live market signals from Indian market sources and enriches them with AI reasoning.

Capabilities:
- BSE announcements
- NSE bulk deal support
- SEBI RSS ingestion
- AI ranking and conviction scoring
- Signal detail expansion and watchlist support

### Persistent AI Assistant

A portfolio-aware assistant that blends live market context with your own holdings and is accessible from every page through a floating tab and slide-out drawer.

It can incorporate:
- Nifty and Sensex context
- USD-INR and gold snapshots
- Radar signals
- Portfolio context from X-Ray

The full `/chat` route still exists for deeper sessions, but quick questions are handled from the drawer.

### Chart Intelligence

Analyze an NSE ticker with OHLCV data and AI-guided technical interpretation.

Features:
- Ticker normalization
- Historical price and volume analysis
- Support and resistance summary
- Trend detection
- Pattern interpretation

### Scam Shield

Scam Shield screens investment messages for fraud patterns, urgency language, guaranteed-return claims, subscription traps, and pump-and-dump indicators.

Features:
- Message analysis for suspicious language
- Ticker mention extraction
- Volume anomaly checks for cited securities
- Fallback analysis when AI output is unavailable

### SIP Tools

Designed for disciplined long-term investing and SIP planning.

Includes:
- SIP Time Machine
- Goal Calculator
- Portfolio Stress Test

The Goal Calculator uses preset goals, risk appetite, and timeline planning. The Stress Test uses user-defined allocation sliders and a crash-history companion section.

### My Briefing

Generates a concise daily investor briefing that summarizes:
- Portfolio-relevant issues
- Market conditions
- Immediate actions
- Top opportunity

If the AI model is unavailable, the API returns a deterministic fallback briefing rather than failing the page.

### Intelligence Center

The Intelligence Center combines three analytical layers:

1. Budget impact analysis
2. Promoter and smart-money signals
3. Behavioral SIP resilience analysis

Recent updates include:
- Multi-select budget interaction support with per-item impact cards
- Shared fallback responses for each layer
- Safer API handling when AI output is unavailable
- Shared dashboard navigation in the page header area
- Top-level and child-level error boundaries so the route degrades gracefully

### Newbie Corner

The learning platform now includes five modules:

- Market Basics
- Risk & Sizing
- Entry & Exit
- Common Mistakes
- Behavioral Finance

It also includes flip cards, progress tracking, a streak counter, and a rotating daily challenge.

## User Experience Notes

The app uses a unified dark glass-morphism design system with:

- Black background base
- Liquid glass cards and panels
- Emerald as the primary action accent
- Clear semantic colors for warning, risk, and information states
- Shared page header with a persistent back-to-dashboard action

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| AI | Google Gemini via `@google/genai` |
| Charts | Lightweight Charts, Recharts |
| Market Data | Yahoo Finance and exchange feeds |
| Parsing | `pdf-parse`, `fast-xml-parser`, `papaparse` |

## Project Structure

```text
app/
  page.tsx                 # Landing page
  layout.tsx               # Root layout and global shell
  globals.css              # Global styles and design system
  api/
    briefing/route.ts      # Daily briefing API
    chat/route.ts          # Market intelligence chat API
    charts/route.ts        # Chart pattern analysis API
    intelligence/          # Budget, promoters, and stay-course APIs
    market/route.ts        # Market snapshot API
    scamcheck/route.ts     # Scam Shield analysis API
    xray/route.ts          # Portfolio X-Ray analysis API
  briefing/page.tsx
  chat/page.tsx
  charts/page.tsx
  intelligence/page.tsx
  newbies/page.tsx
  radar/page.tsx
  scamcheck/page.tsx
  sip/page.tsx
  xray/page.tsx

components/
  AppShell.tsx
  PageHeader.tsx
  Intelligence/
  ScamShield/
  charts/

lib/
  briefing/
  chat/
  intelligence/
  scamcheck/
  feeds/
  radar/
  types/
  gemini.ts
  rateLimit.ts
  yfinance.ts
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- A Google Gemini API key

### Installation

```bash
git clone https://github.com/your-username/etgenai.git
cd etgenai
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

### Production Build

```bash
npm run build
npm start
```

## API Reference

### `POST /api/xray`

Analyzes a CAS PDF or sample portfolio.

Body:
- `pdf` as `multipart/form-data`
- `useSample=true` for the sample portfolio flow

### `GET /api/radar`

Returns live market signals with AI enrichment and fallback signals if external feeds are unavailable.

### `POST /api/chat`

Returns a portfolio-aware market answer with sources.

### `GET /api/charts?ticker=RELIANCE&range=6mo&interval=1d`

Returns OHLCV data and chart pattern analysis for an NSE ticker.

### `GET /api/market`

Returns live market snapshot data.

### `POST /api/briefing`

Generates a personalized daily investor briefing. If the AI response is unavailable, a fallback briefing is returned.

### `POST /api/scamcheck`

Analyzes a suspicious investment message, identifies red flags, and checks for ticker-related volume anomalies.

### `POST /api/intelligence/budget`

Analyzes selected budget announcements against portfolio context.

### `GET /api/intelligence/promoters`

Returns promoter and smart-money analysis.

### `POST /api/intelligence/staycourse`

Returns SIP resilience analysis and behavioral coaching.

## Resilience and Fallback Behavior

Several product areas now degrade gracefully when AI output or external data is unstable:

- Budget analysis returns a deterministic fallback response if Gemini fails
- Promoter intelligence returns fallback market interpretation if the AI layer times out
- Stay-course analysis returns a fallback behavioral result if the AI layer fails
- My Briefing returns a fallback executive summary if AI generation fails
- Scam Shield returns a rule-based analysis if the AI output is unavailable

This keeps the UI functional instead of failing with a generic error.

## Development Notes

- Internal feature pages now surface a persistent `Back to Dashboard` action in the page header area.
- The Intelligence Center supports multi-select budget analysis and per-item impact summaries.
- The app uses client-side storage for portfolio context and selected user progress in a few tools.
- A first-visit name capture modal stores an investor name locally for personalisation.

## Security And Resilience

The app includes several hardening and fallback measures:

- Prompt injection filtering is enabled on the chat API.
- PDF uploads are checked for active JavaScript content before analysis.
- Chart analysis falls back to deterministic technical patterns if Gemini is unavailable.
- Budget, promoter, stay-course, briefing, scam screening, and SIP optimizer flows all return useful fallback responses instead of crashing.
- The intelligence route has local error boundaries and loading states to avoid the refresh loop caused by runtime errors.
- Chart, briefing, and scam flows surface readable error messages instead of blank screens.

## Known Limitations

- Exchange feeds can be rate-limited or intermittently unavailable.
- AI outputs are probabilistic and should be treated as decision support, not financial advice.
- This platform is not SEBI registered.

## Disclaimer

ET InvestIQ is for informational and educational use only. It does not constitute financial advice, and it is not a substitute for professional guidance. Always verify important decisions independently.

## License

No license file is currently included in the repository.
