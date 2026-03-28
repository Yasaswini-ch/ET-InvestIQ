import { rateLimit, getIP } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server"
import { generateStructuredJSON } from "@/lib/gemini"
import { getHistoricalOHLCV } from "@/lib/yfinance"
import { ScamAnalysis, ScamCheckResult, VolumeCheck } from "@/lib/types/scamcheck"
import { buildScamFallback } from "@/lib/scamcheck/fallback"

export const dynamic = "force-dynamic"

const TICKER_MAP: Record<string, string> = {
  "hdfc bank": "HDFCBANK.NS",
  "hdfcbank": "HDFCBANK.NS",
  "reliance": "RELIANCE.NS",
  "sbi": "SBIN.NS",
  "state bank of india": "SBIN.NS",
  "tata motors": "TATAMOTORS.NS",
  "infosys": "INFY.NS",
  "adani": "ADANIENT.NS",
  "zomato": "ZOMATO.NS",
  "yes bank": "YESBANK.NS",
  "yesbank": "YESBANK.NS",
  "suzlon": "SUZLON.NS",
  "paytm": "PAYTM.NS",
}

export function extractTicker(message: string): string | null {
  const lower = message.toLowerCase()

  for (const [key, ticker] of Object.entries(TICKER_MAP)) {
    if (lower.includes(key)) {
      return ticker
    }
  }

  // Match an already-qualified NSE ticker
  const nsMatch = message.match(/\b([A-Z]{2,15})\.NS\b/)
  if (nsMatch) return nsMatch[0]

  // Common contextual patterns
  const contextPatterns = [
    /\bBUY\s+([A-Z]{3,15})\b/,
    /\b([A-Z]{3,15})\s+(?:at|AT)\s+CMP\b/,
    /\b([A-Z]{4,15})\s+(?:stock|STOCK|share|SHARE|ltd|LTD)\b/,
  ]

  const skipWords = new Set([
    "BUY", "SELL", "CMP", "FREE", "TIPS", "CALL", "STOCK", "JOIN",
    "ONLY", "SEND", "THIS", "THAT", "WITH", "FROM", "SEBI", "NSE",
    "BSE", "VIP", "UPI", "SMS", "RISK", "ALGO", "PLAN",
  ])

  for (const pattern of contextPatterns) {
    const match = message.match(pattern)
    if (match?.[1] && !skipWords.has(match[1])) {
      return `${match[1]}.NS`
    }
  }

  return null
}

async function checkVolumeAnomaly(ticker: string): Promise<VolumeCheck | null> {
  try {
    const candles = await getHistoricalOHLCV(ticker, "2mo", "1d")
    if (candles.length < 6) return null

    const allVolumes = candles.map((c) => c.volume)
    const avgVolume = allVolumes.reduce((a, b) => a + b, 0) / allVolumes.length
    const recentVolumes = candles.slice(-5).map((c) => c.volume)
    const recentVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length
    const volumeSpike = avgVolume > 0 ? recentVolume / avgVolume : 0

    let anomalyDetected = false
    let severity: "HIGH" | "MEDIUM" | "NONE" = "NONE"

    if (volumeSpike > 2.0) {
      anomalyDetected = true
      severity = "HIGH"
    } else if (volumeSpike > 1.4) {
      anomalyDetected = true
      severity = "MEDIUM"
    }

    return { ticker, anomalyDetected, severity, volumeSpike, avgVolume, recentVolume }
  } catch {
    return null
  }
}

const SYSTEM_PROMPT = `You are a SEBI-trained financial fraud detection AI for Indian retail investors.
Your job is to analyze suspicious investment messages and determine how likely
they are to be scams, pump-and-dump schemes, unregistered advisor solicitations,
or misleading investment promotions.

You will output ONLY a valid JSON object with exactly this shape:
{
  "scamProbability": number,
  "verdict": string,
  "verdictReason": string,
  "redFlags": [
    {
      "flag": string,
      "explanation": string,
      "severity": string
    }
  ],
  "sebiViolations": string[],
  "mentionedTicker": string | null,
  "extractedClaims": string[],
  "safeAlternative": string,
  "isUnregisteredAdvisor": boolean,
  "guaranteedReturnsFound": boolean,
  "urgencyTacticsFound": boolean
}

SEBI RED FLAG PATTERNS to always check for:
- Guaranteed returns ("assured", "guaranteed", "risk-free", "fixed return")
- Urgency language ("limited seats", "offer closes tonight", "act now", "last chance")
- Unregistered advisor signals (no SEBI registration number mentioned, "tips provider", "calls provider")
- Unrealistic return claims (">20% monthly", "10x in 6 months", "multibagger guaranteed")
- Pump-and-dump language ("this stock will 10x", "operator is active", "big move coming")
- Penny stock promotion (stocks under ₹10 being aggressively promoted)
- Payment demands (asking for subscription fees to "premium groups")
- WhatsApp/Telegram group solicitation
- Claims of insider information ("operator buying", "promoter accumulating secretly")
- Fear of missing out framing ("only for select members", "exclusive", "VIP")

Verdict thresholds:
- 0–25: SAFE
- 26–50: PROBABLY SAFE
- 51–74: SUSPICIOUS
- 75–100: LIKELY SCAM

Output ONLY the JSON. No markdown, no explanation, no preamble.`

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  if (!rateLimit(ip, 5, 60_000)) {
    return Response.json(
      { error: "Too many requests. Please wait a minute." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({} as { message?: string }));
  const message = body?.message ?? "";

  try {
    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const ticker = extractTicker(message)

    const [analysis, volumeCheck] = await Promise.all([
      generateStructuredJSON<ScamAnalysis>(message, SYSTEM_PROMPT),
      ticker ? checkVolumeAnomaly(ticker) : Promise.resolve(null),
    ])

    const result: ScamCheckResult = {
      analysis,
      volumeCheck,
      analyzedAt: new Date().toISOString(),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Scam check API failed:", error)
    const ticker = message ? extractTicker(message) : null
    const volumeCheck = ticker ? await checkVolumeAnomaly(ticker) : null

    return NextResponse.json({
      analysis: buildScamFallback(message, ticker),
      volumeCheck,
      analyzedAt: new Date().toISOString(),
    } satisfies ScamCheckResult)
  }
}
