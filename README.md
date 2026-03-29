# ET InvestIQ

The AI-powered investment intelligence layer for Indian retail investors.

ET InvestIQ is built for the reality of Indian investing: too many tips, too much noise, too little actionable guidance. It combines portfolio diagnostics, live signal discovery, chart intelligence, scam detection, SIP planning, market-aware chat, watchlists, briefings, and AI-generated market videos into one investor workflow.

This project is designed around the core challenge: turn ET Markets-style data into actionable, money-making, portfolio-aware decisions for Indian retail investors.

## Problem

India has 14 crore+ demat accounts, but many retail investors still operate with fragmented tools and poor context:

- reacting to WhatsApp tips
- missing exchange and regulatory filings
- struggling to read technical patterns
- managing mutual fund portfolios on gut feel
- lacking portfolio-specific decision support

ET InvestIQ solves that by acting as an intelligence layer across the full investor journey.

## What ET InvestIQ Covers

The platform now maps strongly to the core challenge pillars:

1. Opportunity Radar
2. Chart Pattern Intelligence
3. Market ChatGPT - Next Gen
4. AI Market Video Engine

It also adds portfolio-aware layers that make the experience feel like a real investor operating system rather than a collection of separate demos.

## Core Product Modules

### 1. Portfolio X-Ray (`/xray`)

Upload a CAMS or KFintech CAS statement and get a structured AI-driven portfolio diagnosis.

Features:
- portfolio health score
- overall XIRR and gain tracking
- fund-level breakdown
- overlap heatmap
- expense drag estimation
- diversification scoring
- AI rebalancing plan
- share card
- browser-native `Export PDF`

Stored context:
- writes investor portfolio context to local storage for downstream personalization
- powers Radar, Briefing, Intelligence, SIP Tools, and Chat personalization

### 2. Opportunity Radar (`/radar`)

Radar is the signal-finder layer. It ingests live market events and turns them into ranked opportunity or risk signals.

Data inputs:
- BSE announcements
- NSE bulk deals
- SEBI feed events
- quote enrichment via Yahoo Finance

Current Radar capabilities:
- ranked AI-refined signals
- conviction and risk scoring
- `Why This Is A Signal`
- `Why This Matters`
- `What Changed`
- signal score normalization
- watchlist-aware filtering
- portfolio-aware impact mapping

New portfolio impact layer:
- direct portfolio exposure detection from latest X-Ray snapshot
- thematic overlap detection using fund/category context
- explicit `no overlap` fallback instead of silent ambiguity

### 3. Chart Pattern Intelligence (`/charts`)

Analyzes NSE tickers with OHLCV market data and AI-guided technical interpretation.

Features:
- ticker normalization
- support and resistance zones
- trend detection
- breakout and continuation framing
- volume spike interpretation
- AI pattern explanations
- stock-specific historical edge layer

Historical edge layer now includes:
- setup label
- sample size
- win rate
- average return
- median return
- max drawdown
- invalidation level
- reward/risk ratio

This makes the chart layer feel closer to real technical decision support instead of generic chart commentary.

### 4. Market ChatGPT - Next Gen (`/chat` + global drawer)

The chat system is now a portfolio-aware, source-backed assistant rather than a plain Q and A surface.

Features:
- live market context injection
- Radar signal grounding
- portfolio-aware responses using X-Ray context
- source-backed response cards
- structured reasoning blocks shown in UI
- recent session history stored locally
- reloadable sessions
- clear history support
- global `/` keyboard shortcut to open assistant
- onboarding tooltip for shortcut discovery

Reasoning upgrades:
- assistant responses now show structured reasoning steps
- source cards include snippets so users can see why a source was used
- deterministic fallback responses still include reasoning rather than collapsing to a weak generic answer

### 5. AI Market Video Engine (`/videos`)

This is the newest high-visibility module and the missing challenge pillar that has now been added.

Video templates:
- Daily Market Wrap
- Top Movers
- Sector Rotation
- FII / DII Flow
- Radar Alerts

Current capabilities:
- AI-generated title, hook, summary, scenes, CTA, and sources
- browser-native scene preview
- speech synthesis preview
- `Pause` / `Resume` controls
- previous / next scene controls
- timeline with scene timestamps
- aspect ratio presets: `16:9`, `9:16`, `1:1`
- subtitle burn-in
- downloadable `.webm` export
- downloadable `.srt` captions
- downloadable storyboard `.json`
- deterministic fallback video brief if live data or model output fails

### 6. Scam Shield (`/scamcheck`)

Built for the fraud-heavy reality of retail investing.

Features:
- single-message scam analysis
- Bulk Check tab for up to 10 messages
- risk scoring
- top red flag summary
- expanded flag analysis
- rule-based fallback scoring if model fails
- shareable result card export
- copy-link support with score and verdict context

### 7. SIP Tools (`/sip`)

The SIP toolkit now includes multiple investor decision flows under one surface.

Features:
- SIP Time Machine
- Goal Calculator
- Stress Test
- Portfolio What-If Simulator

What-If Simulator:
- visible as a SIP Tools subfeature
- compares shifting capital from one holding to another
- supports `1Y`, `3Y`, `5Y`
- plots actual vs simulated corpus using Recharts
- AI interpretation line
- deterministic fallback trajectory when live data is unavailable

### 8. My Briefing (`/briefing`)

Creates a concise daily investor briefing that combines market and portfolio context.

Features:
- personalized alerts
- top opportunity callout
- investor action summary
- market mood indicator in header
- browser-native `Export PDF`
- deterministic fallback payloads

### 9. Intelligence Center (`/intelligence`)

The intelligence workflow goes deeper into event interpretation.

Current layers:
- Budget impact analysis
- Promoter / smart-money signals
- Stay-the-course behavioral analysis

Features:
- portfolio-aware summaries
- deterministic fallback responses per layer
- graceful loading and error handling

### 10. Watchlist (`/watchlist`)

A lightweight watchlist linked to live quote context and Radar alerts.

Features:
- local persistence under `et_watchlist`
- search and add tickers
- quote cards with price and change
- active Radar badges where available
- empty state guidance
- retry and fallback handling

### 11. Market Mood Indicator

A compact market pulse used across the homepage and briefing.

Signals shown:
- mood label such as `FEARFUL`, `CAUTIOUS`, `NEUTRAL`, `OPTIMISTIC`, `BULLISH`
- NIFTY move
- VIX reading
- FII tone

### 12. Newbie Corner (`/newbies`)

Investor education module for first-time or still-learning users.

Includes:
- market basics
- risk and sizing
- entry and exit concepts
- common mistakes
- behavioral finance
- progress and streak-style engagement

## Portfolio-Aware Intelligence Flow

A major strength of ET InvestIQ is that modules share context instead of working in isolation.

Current shared flow:
- X-Ray stores portfolio context in local storage
- Radar checks whether signals affect current holdings
- Chat uses market plus portfolio context together
- Briefing uses holdings to prioritize alerts
- SIP Tools can use portfolio context for planning and stress testing
- Watchlist surfaces Radar signals on tracked names

This is where the platform becomes more than a collection of widgets.

## UX Highlights

The app is designed to avoid dead ends and blank states.

Current UX behavior:
- explicit loading states
- explicit populated states
- explicit empty and fallback states
- motion-driven card entry with Framer Motion
- mobile-friendly layouts
- browser-print PDF export for X-Ray and Briefing
- global floating AI assistant access

## Resilience And Fallbacks

A key architectural rule in this project is that no major route should collapse into a blank UI if data or model output fails.

Implemented fallback philosophy:
- every new API route returns deterministic structured fallback payloads
- Radar returns curated signal output if feeds or AI fail
- Charts return deterministic pattern analysis if model output fails
- Chat returns grounded fallback answers and reasoning steps
- What-If returns deterministic chart data when live history is unavailable
- Scam Shield bulk and single routes return valid rule-based analysis if AI fails
- Mood route returns a valid neutral delayed-data payload
- Watchlist route returns price-only output with empty signals if Radar data is unavailable
- Video engine returns a fully usable fallback brief

## Key Technical Features

### Frontend
- Next.js 14 App Router
- TypeScript strict mode
- Tailwind CSS
- Framer Motion
- Recharts
- browser-native print/PDF export
- `html2canvas` for visual card capture

### AI And Data
- Gemini integration via `lib/gemini.ts`
- Yahoo Finance-based quote and OHLCV support
- exchange and regulatory feed parsing
- portfolio-context-aware prompting
- deterministic fallback generators across modules

### State And Persistence
- local storage keys are prefixed with `et_`
- recent chat sessions stored under `et_chat_history`
- watchlist stored under `et_watchlist`
- portfolio context stored under `et_portfolio_context`
- X-Ray result snapshot stored under `et_xray_result`

## Routes

### Pages
- `/`
- `/xray`
- `/radar`
- `/scamcheck`
- `/intelligence`
- `/sip`
- `/briefing`
- `/chat`
- `/charts`
- `/newbies`
- `/watchlist`
- `/whatif`
- `/videos`

### API Routes
- `POST /api/xray`
- `GET /api/radar`
- `POST /api/scamcheck`
- `POST /api/scamcheck/bulk`
- `POST /api/whatif`
- `GET /api/watchlist/signals`
- `GET /api/mood`
- `POST /api/chat`
- `GET /api/charts`
- `POST /api/briefing`
- `POST /api/videos`
- plus supporting intelligence and SIP APIs already in the repo

## Demo Flow

A strong demo sequence now looks like this:

1. Open homepage and show Market Mood plus major modules.
2. Run Portfolio X-Ray using sample CAS data.
3. Show health score, overlap, expense drag, and rebalancing plan.
4. Open Radar and show which signals directly affect the current portfolio.
5. Open Charts and show stock-specific success-rate and invalidation context.
6. Open Chat and ask a portfolio-aware question to show reasoning plus citations.
7. Open Scam Shield and run both single and bulk fraud checks.
8. Open SIP Tools and run the What-If Simulator.
9. Open Watchlist and show Radar-linked signal badges.
10. Open Videos and generate a market wrap or Radar alert video.
11. Export X-Ray or Briefing to PDF.

That tells a complete story: signal discovery, portfolio impact, technical validation, conversational analysis, and content generation.

## Why This Project Stands Out

What makes ET InvestIQ stronger than a typical hackathon dashboard:

- it is India-focused, not generic global finance UI
- it connects market signals to actual investor holdings
- it combines fraud detection, portfolio diagnosis, chat, charts, and video in one product
- it prioritizes fallbacks and user trust instead of failing open
- it now covers all four major challenge-aligned pillars, including the video engine

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Charts | Recharts |
| AI | Gemini |
| Parsing | `pdf-parse`, XML and CSV feed utilities |
| Capture / export | `html2canvas`, browser print |
| Data | Yahoo Finance plus BSE, NSE, and SEBI feed ingestion |

## Project Docs

- [STRUCTURE.md](./STRUCTURE.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [API.md](./API.md)
- [DEPLOY.md](./DEPLOY.md)

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- Gemini API key

### Install

```bash
git clone https://github.com/your-username/etgenai.git
cd etgenai
npm install
```

### Environment

Create `.env.local`:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### Run locally

```bash
npm run dev
```

Open `http://localhost:3000`

Recommended routes to test:
- `/xray`
- `/radar`
- `/charts`
- `/chat`
- `/scamcheck`
- `/sip`
- `/whatif`
- `/watchlist`
- `/briefing`
- `/videos`

### Production build

```bash
npm run build
npm start
```

## Known Limitations

- exchange feeds may be intermittent or rate-limited
- AI outputs are still decision support, not guaranteed investment outcomes
- browser-native video export is `.webm`, not full MP4 render pipeline yet
- speech synthesis preview is available, but embedded narration export is not yet a full production render workflow
- this platform is not SEBI-registered advice software

## Disclaimer

ET InvestIQ is for informational and educational use only. It does not constitute investment advice. Users should verify important decisions independently and consult qualified professionals where appropriate.
