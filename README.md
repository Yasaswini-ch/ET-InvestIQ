# The investment intelligence layer 14 crore Indian investors do not have yet

## ET InvestIQ

Your uncle got a WhatsApp tip promising 40% monthly returns. Your colleague paused her SIP during a market dip and lost years of compounding. You received a Budget update and had no idea whether it changed anything in your portfolio. ET InvestIQ exists for those moments.

It turns market noise into portfolio-specific guidance for Indian retail investors, combining portfolio diagnostics, live market context, scam screening, behavioral coaching, SIP planning, and daily briefings into one product experience.

## Impact Model

- 14 crore Indian demat accounts in the addressable market
- 10 seconds to screen a suspicious message that would normally take minutes of manual judgment
- 1 portfolio view that connects what is happening in the market to what it means for your holdings

## Demo Flow

Open the app and the product feels alive immediately.

1. Land on the homepage and see today’s market context plus the main pathways into the product.
2. Open Portfolio X-Ray and load a sample CAS portfolio.
3. Watch the health score, overlap, XIRR, and rebalancing guidance appear together.
4. Move into Scam Shield and paste a suspicious WhatsApp investment message.
5. See the fraud patterns called out clearly instead of guessing.
6. Open SIP Tools and test a goal or a crash scenario with real allocation logic.
7. Finish in the Intelligence Center and see Budget, Promoter, and Stay Course analysis tied back to a portfolio.

That is the core loop: market event -> portfolio impact -> action.

## What It Solves

- You received a suspicious investment tip on WhatsApp -> Scam Shield explains why it is risky.
- The market fell and you are unsure whether to change your SIP -> SIP Tools shows the long-term effect.
- A Budget announcement landed and you do not know if it matters -> My Briefing and Intelligence Center translate it into portfolio impact.
- You want to understand whether your holdings overlap too much -> Portfolio X-Ray exposes concentration and drag.
- You need a quick answer while browsing the app -> the floating AI assistant drawer is available from every page.

## Why This Is Different

- Zerodha Coin shows what you hold. ET InvestIQ tells you what to do about it.
- ET Money can track a SIP. ET InvestIQ shows what a Budget change means in rupees for your specific portfolio.
- Most tools look at markets in isolation. ET InvestIQ connects markets, holdings, behavior, and risk in one flow.

## Product Modules

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

A portfolio-aware assistant that blends live market context with your holdings and is accessible from every page through a floating tab and slide-out drawer.

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

### First-Visit Experience

On first visit, the app asks whether the user is a beginner or experienced investor and whether their portfolio is uploaded.

Based on the answer, it routes them to:
- Newbie Corner for beginners
- Opportunity Radar for experienced users without a portfolio
- Portfolio X-Ray for experienced users with a portfolio

## Security And Resilience

The app includes several hardening and fallback measures:

- Prompt injection filtering is enabled on the chat API
- PDF uploads are checked for active JavaScript content before analysis
- Chart analysis falls back to deterministic technical patterns if Gemini is unavailable
- Budget, promoter, stay-course, briefing, scam screening, and SIP optimizer flows all return useful fallback responses instead of crashing
- The intelligence route has local error boundaries and loading states to avoid the refresh loop caused by runtime errors
- Chart, briefing, and scam flows surface readable error messages instead of blank screens

## Tech Stack

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

## Known Limitations

- Exchange feeds can be rate-limited or intermittently unavailable
- AI outputs are probabilistic and should be treated as decision support, not financial advice
- This platform is not SEBI registered

## Disclaimer

ET InvestIQ is for informational and educational use only. It does not constitute financial advice, and it is not a substitute for professional guidance. Always verify important decisions independently.
