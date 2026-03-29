import { NextRequest, NextResponse } from "next/server";
import { getIP, rateLimit } from "@/lib/rateLimit";
import { formatCurrencyINR } from "@/lib/currency";
import { WhatIfPeriod, WhatIfRequest, WhatIfResponse } from "@/lib/types/whatif";
import { getHistoricalOHLCV, normalizeNseTicker } from "@/lib/yfinance";

const PERIOD_TO_RANGE: Record<WhatIfPeriod, { range: string; months: number }> = {
  "1Y": { range: "1y", months: 12 },
  "3Y": { range: "3y", months: 36 },
  "5Y": { range: "5y", months: 60 },
};

function instrumentLabel(input: string): string {
  return input.trim() || "Instrument";
}

function buildFallback(payload: WhatIfRequest): WhatIfResponse {
  const months = PERIOD_TO_RANGE[payload.period].months;
  const baseCorpus = 100000;
  const actualGrowth = payload.period === "5Y" ? 0.012 : payload.period === "3Y" ? 0.01 : 0.008;
  const simulatedGrowth = actualGrowth + 0.0025;
  let actual = baseCorpus;
  let simulated = baseCorpus;

  const chartData = Array.from({ length: months }, (_, index) => {
    actual *= 1 + actualGrowth;
    simulated *= 1 + simulatedGrowth + (index % 6 === 0 ? 0.001 : 0);
    const pointDate = new Date();
    pointDate.setMonth(pointDate.getMonth() - (months - index - 1));

    return {
      date: pointDate.toISOString().slice(0, 10),
      actual: Number(actual.toFixed(2)),
      simulated: Number((simulated + payload.amount * 0.02).toFixed(2)),
    };
  });

  const actualCorpus = chartData.at(-1)?.actual ?? baseCorpus;
  const simulatedCorpus = chartData.at(-1)?.simulated ?? baseCorpus;
  const delta = simulatedCorpus - actualCorpus;

  return {
    actualCorpus,
    simulatedCorpus,
    delta,
    deltaPercent: actualCorpus > 0 ? Number(((delta / actualCorpus) * 100).toFixed(2)) : 0,
    chartData,
    aiInterpretation: `Shifting ${formatCurrencyINR(payload.amount)} from ${instrumentLabel(payload.fundA)} to ${instrumentLabel(payload.fundB)} over ${payload.period} would have ${delta >= 0 ? "added" : "reduced"} ${formatCurrencyINR(Math.abs(delta))} based on fallback market data.`,
    disclaimer: "Live data unavailable. Showing deterministic fallback simulation.",
  };
}

async function loadSeries(input: string, period: WhatIfPeriod) {
  const symbol = input.includes(".") || input.startsWith("^") ? input : normalizeNseTicker(input);
  const candles = await getHistoricalOHLCV(symbol, PERIOD_TO_RANGE[period].range, "1mo");
  return candles.map((candle) => ({
    date: candle.time.slice(0, 10),
    close: candle.close,
  }));
}

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  if (!rateLimit(ip, 4, 60_000)) {
    return NextResponse.json(buildFallback({ fundA: "Fund A", fundB: "Fund B", amount: 10000, period: "1Y" }));
  }

  let payload: WhatIfRequest = { fundA: "Fund A", fundB: "Fund B", amount: 10000, period: "1Y" };

  try {
    const body = (await req.json()) as Partial<WhatIfRequest>;
    payload = {
      fundA: String(body.fundA ?? "").trim(),
      fundB: String(body.fundB ?? "").trim(),
      amount: Math.max(0, Number(body.amount ?? 0)),
      period: body.period === "3Y" || body.period === "5Y" ? body.period : "1Y",
    };

    if (!payload.fundA || !payload.fundB || payload.amount <= 0) {
      return NextResponse.json(buildFallback(payload));
    }

    const [seriesA, seriesB] = await Promise.all([
      loadSeries(payload.fundA, payload.period),
      loadSeries(payload.fundB, payload.period),
    ]);

    if (seriesA.length < 3 || seriesB.length < 3) {
      return NextResponse.json(buildFallback(payload));
    }

    const length = Math.min(seriesA.length, seriesB.length);
    const alignedA = seriesA.slice(-length);
    const alignedB = seriesB.slice(-length);
    const baseCorpus = 100000;
    const shiftedAmount = Math.min(payload.amount, baseCorpus * 0.4);
    const startA = alignedA[0].close;
    const startB = alignedB[0].close;

    const chartData = alignedA.map((point, index) => {
      const actual = baseCorpus * (point.close / startA);
      const retainedA = (baseCorpus - shiftedAmount) * (alignedA[index].close / startA);
      const shiftedB = shiftedAmount * (alignedB[index].close / startB);
      return {
        date: point.date,
        actual: Number(actual.toFixed(2)),
        simulated: Number((retainedA + shiftedB).toFixed(2)),
      };
    });

    const actualCorpus = chartData.at(-1)?.actual ?? baseCorpus;
    const simulatedCorpus = chartData.at(-1)?.simulated ?? baseCorpus;
    const delta = simulatedCorpus - actualCorpus;

    return NextResponse.json({
      actualCorpus,
      simulatedCorpus,
      delta,
      deltaPercent: actualCorpus > 0 ? Number(((delta / actualCorpus) * 100).toFixed(2)) : 0,
      chartData,
      aiInterpretation: `Shifting ${formatCurrencyINR(payload.amount)} from ${instrumentLabel(payload.fundA)} to ${instrumentLabel(payload.fundB)} over ${payload.period} would have ${delta >= 0 ? "added" : "reduced"} ${formatCurrencyINR(Math.abs(delta))} to your corpus based on historical price data.`,
    } satisfies WhatIfResponse);
  } catch (error) {
    console.error("What-if API failed:", error);
    return NextResponse.json(buildFallback(payload));
  }
}

