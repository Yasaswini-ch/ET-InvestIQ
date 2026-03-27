"use client";

import { useEffect, useRef } from "react";
import { CandlestickSeries, ColorType, HistogramSeries, createChart, createSeriesMarkers } from "lightweight-charts";
import { OhlcvCandle } from "@/lib/types/market";

function toChartDate(iso: string) {
  return iso.slice(0, 10);
}

type ChartOverlayProps = {
  candles: OhlcvCandle[];
  supportZones: number[];
  resistanceZones: number[];
  breakoutPoint?: string | null;
  patternWindow?: { start: string; end: string } | null;
};

function getZoneBounds(candles: OhlcvCandle[], window?: { start: string; end: string } | null) {
  if (!window) return null;
  const startIdx = candles.findIndex((c) => c.time.startsWith(window.start.slice(0, 10)));
  const endIdx = candles.findIndex((c) => c.time.startsWith(window.end.slice(0, 10)));
  if (startIdx < 0 || endIdx < 0 || endIdx <= startIdx) return null;
  const left = (startIdx / candles.length) * 100;
  const width = ((endIdx - startIdx) / candles.length) * 100;
  return { left, width };
}

export default function OhlcvChart({ candles, supportZones, resistanceZones, breakoutPoint, patternWindow }: ChartOverlayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zone = getZoneBounds(candles, patternWindow);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0a0a0a" },
        textColor: "rgba(255,255,255,0.4)",
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.1)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.1)",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      autoSize: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#059669",
      downColor: "#DC2626",
      borderVisible: false,
      wickUpColor: "#059669",
      wickDownColor: "#DC2626",
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
      color: "#E8651A88",
    });

    candleSeries.setData(
      candles.map((c) => ({
        time: toChartDate(c.time),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );
    supportZones.slice(0, 2).forEach((level) => {
      candleSeries.createPriceLine({
        price: level,
        color: "#05966966",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "Support",
      });
    });
    resistanceZones.slice(0, 2).forEach((level) => {
      candleSeries.createPriceLine({
        price: level,
        color: "#DC262666",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "Resistance",
      });
    });
    if (breakoutPoint) {
      const markerTime = breakoutPoint.slice(0, 10);
      createSeriesMarkers(candleSeries, [
        {
          time: markerTime,
          position: "aboveBar",
          shape: "arrowUp",
          color: "#E8651A",
          text: "AI Breakout",
        },
      ]);
    }

    volumeSeries.setData(
      candles.map((c) => ({
        time: toChartDate(c.time),
        value: c.volume,
      }))
    );

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, [candles, supportZones, resistanceZones, breakoutPoint]);

  return (
    <div className="liquid-glass rounded-2xl p-4">
      <h3 className="text-sm font-bold text-white mb-3">OHLCV Chart</h3>
      <div className="relative h-[420px] w-full">
        {zone && (
          <div
            className="absolute top-0 bottom-0 z-10 pointer-events-none border-x border-emerald-400/30 bg-emerald-500/5"
            style={{ left: `${zone.left}%`, width: `${zone.width}%` }}
          >
            <span className="absolute top-2 left-2 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              Pattern Zone
            </span>
          </div>
        )}
        <div ref={containerRef} className="h-[420px] w-full" />
      </div>
    </div>
  );
}
