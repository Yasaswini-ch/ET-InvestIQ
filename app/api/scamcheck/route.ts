import { rateLimit, getIP } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";
import { getHistoricalOHLCV } from "@/lib/yfinance";
import { ScamCheckResult, VolumeCheck } from "@/lib/types/scamcheck";
import { extractTicker, runScamAnalysis } from "@/lib/scamcheck/service";

export const dynamic = "force-dynamic";

async function checkVolumeAnomaly(ticker: string): Promise<VolumeCheck | null> {
  try {
    const candles = await getHistoricalOHLCV(ticker, "2mo", "1d");
    if (candles.length < 6) return null;

    const allVolumes = candles.map((candle) => candle.volume);
    const avgVolume = allVolumes.reduce((sum, value) => sum + value, 0) / allVolumes.length;
    const recentVolumes = candles.slice(-5).map((candle) => candle.volume);
    const recentVolume = recentVolumes.reduce((sum, value) => sum + value, 0) / recentVolumes.length;
    const volumeSpike = avgVolume > 0 ? recentVolume / avgVolume : 0;

    let anomalyDetected = false;
    let severity: "HIGH" | "MEDIUM" | "NONE" = "NONE";

    if (volumeSpike > 2.0) {
      anomalyDetected = true;
      severity = "HIGH";
    } else if (volumeSpike > 1.4) {
      anomalyDetected = true;
      severity = "MEDIUM";
    }

    return { ticker, anomalyDetected, severity, volumeSpike, avgVolume, recentVolume };
  } catch {
    return null;
  }
}

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
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const ticker = extractTicker(message);
    const [analysis, volumeCheck] = await Promise.all([
      runScamAnalysis(message),
      ticker ? checkVolumeAnomaly(ticker) : Promise.resolve(null),
    ]);

    return NextResponse.json({
      analysis,
      volumeCheck,
      analyzedAt: new Date().toISOString(),
    } satisfies ScamCheckResult);
  } catch (error) {
    console.error("Scam check API failed:", error);
    const ticker = message ? extractTicker(message) : null;
    const volumeCheck = ticker ? await checkVolumeAnomaly(ticker) : null;

    return NextResponse.json({
      analysis: await runScamAnalysis(message),
      volumeCheck,
      analyzedAt: new Date().toISOString(),
    } satisfies ScamCheckResult);
  }
}

