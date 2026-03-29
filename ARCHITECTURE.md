# ET InvestIQ Architecture Document

This document summarizes ET InvestIQ system architecture, logical AI agent roles, communication paths, tool integrations, and failure-handling behavior.

## 1) System Diagram

```mermaid
%%{init: {'theme': 'default', 'themeVariables': { 'background': '#ffffff', 'primaryTextColor': '#111111', 'lineColor': '#374151' }}}%%
flowchart LR
  U["Investor Web Client"]

  subgraph FE["Next.js App Router Frontend"]
    PAGES["Pages: /xray /radar /chat /charts /sip /briefing /intelligence /newbies"]
    SHELL["AppShell + ChatDrawer"]
    LS["localStorage Context: xray_result / investor profile / progress"]
  end

  subgraph API["Server Routes app/api"]
    XR[/api/xray]
    RD[/api/radar]
    CH[/api/chat]
    CT[/api/charts]
    SC[/api/scamcheck]
    BR[/api/briefing]
    IN1[/api/intelligence/budget]
    IN2[/api/intelligence/promoters]
    IN3[/api/intelligence/staycourse]
    SIP[/api/sip]
    SIPO[/api/sipoptimizer]
    ST[/api/stress]
  end

  subgraph CORE["Core Libraries"]
    RL["rateLimit.ts"]
    GM["gemini.ts"]
    CL["chat/llm.ts provider router"]
    YF["yfinance.ts"]
    FEEDS["feeds: BSE/NSE/SEBI"]
    RAD["radar normalize/enrich/scoring"]
    FALL["fallback builders"]
  end

  subgraph EXT["External Services"]
    OR["OpenRouter Chat Models"]
    GE["Gemini API"]
    YH["Yahoo Finance"]
    EX["BSE / NSE / SEBI feeds"]
  end

  U --> PAGES
  PAGES --> SHELL
  PAGES <--> LS
  PAGES --> API

  XR --> RL --> GM
  XR --> FALL
  RD --> RL --> FEEDS
  RD --> RAD
  RD --> GM
  RD --> FALL
  CH --> RL
  CH --> CL
  CH --> YF
  CH --> FEEDS
  CH --> RAD
  CH --> FALL
  CT --> RL
  CT --> YF
  CT --> GM
  SC --> RL
  SC --> GM
  SC --> FALL
  BR --> RL
  BR --> GM
  BR --> FALL
  IN1 --> RL
  IN1 --> GM
  IN1 --> FALL
  IN2 --> RL
  IN2 --> GM
  IN2 --> FALL
  IN3 --> RL
  IN3 --> GM
  IN3 --> FALL
  SIP --> RL
  SIPO --> RL
  SIPO --> GM
  ST --> RL

  CL --> OR
  GM --> GE
  YF --> YH
  FEEDS --> EX
```

## 2) Logical Agent Roles

ET InvestIQ uses role-oriented AI modules rather than a single monolithic assistant.

1. **Portfolio Analyst Agent** (`/api/xray`)
- Interprets CAS portfolio data.
- Produces health score, overlap context, and rebalancing guidance.

2. **Radar Intelligence Agent** (`/api/radar`)
- Consolidates BSE/NSE/SEBI events.
- Normalizes signals, enriches with quotes, ranks by conviction.

3. **Market Chat Agent** (`/api/chat`)
- Conversational layer with market + portfolio context.
- Uses `chat/llm.ts` provider routing (OpenRouter for chat; Gemini preserved for non-chat flows).

4. **Chart Pattern Agent** (`/api/charts`)
- Blends deterministic OHLCV analytics with AI interpretation.

5. **Scam Detection Agent** (`/api/scamcheck`)
- Flags fraud patterns and urgency language.
- Returns deterministic fallback when model output fails.

6. **Briefing Agent** (`/api/briefing`)
- Generates daily actionable investor summary.
- Falls back to structured non-crashing output.

7. **Intelligence Center Agents** (`/api/intelligence/*`)
- Layer 1 Budget impact analyzer.
- Layer 2 Promoter/smart-money analyzer.
- Layer 3 Stay-course behavior coach.

8. **SIP Planning Engines** (`/api/sip`, `/api/sipoptimizer`, `/api/stress`)
- Deterministic projection math for reliability.
- AI used only where narrative allocation reasoning is needed.

## 3) Communication & Data Flow

1. User action in UI triggers route-specific API call.
2. Route applies IP-based rate limit via `lib/rateLimit.ts`.
3. Route composes deterministic context from market feeds, quotes, and local portfolio context.
4. Route calls AI provider (OpenRouter for chat route, Gemini for other AI routes) only when needed.
5. If AI/provider fails, route returns deterministic fallback payload instead of crashing.
6. UI renders result, loading state, and fallback/error messaging without route-level breakage.

## 4) Tool Integrations

1. **LLM Providers**
- `lib/gemini.ts`: structured JSON generation for non-chat modules.
- `lib/chat/llm.ts`: chat provider router with OpenRouter support and model fallback chain.

2. **Market Data**
- `lib/yfinance.ts` for Nifty/Sensex/stocks and OHLCV.
- `lib/feeds/*` for BSE/NSE/SEBI event ingestion.

3. **Client Context**
- `localStorage` for portfolio context (`xray_result`), investor identity/tier, and learning progress.

4. **Visualization**
- Recharts and Lightweight Charts for scenario and technical visualization.

## 5) Error Handling & Resilience Logic

1. **Rate-limit guard on APIs**
- Routes enforce request throttling and return `429` when exceeded.

2. **Provider-failure fallback**
- If Gemini/OpenRouter fails, routes return structured deterministic payloads where implemented.
- Chat route uses intent-aware fallback responses to avoid empty UX.

3. **Feed-failure fallback**
- Radar returns curated fallback signals when live feeds fail.

4. **Build-time quota protection**
- Gemini-consuming GET routes are configured as dynamic where required to avoid static build-time quota burn.

5. **Input hardening**
- Chat applies message-length limits, message-count limits, and prompt-injection pattern checks.

6. **UI safety**
- Components guard against empty/null arrays and render degraded-but-functional states.
- Loading indicators and retry-compatible states prevent dead-end interactions.

## 6) Deployment Notes (Architecture-Relevant)

1. Keep `GEMINI_API_KEY` for non-chat AI routes.
2. Use chat-specific provider variables for `/api/chat`:
- `CHAT_PROVIDER`
- `CHAT_OPENROUTER_API_KEY`
- `CHAT_OPENROUTER_MODEL` or `CHAT_OPENROUTER_MODEL_LIST`
3. Validate environment variables in Vercel Production before testing chat behavior.

---
Back to [README.md](./README.md)
