"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

export default function OverlapHeatmap({ data, reveal = false }: { data: any[]; reveal?: boolean }) {
  const funds = Array.from(new Set(data.flatMap((item: any) => [item.fund1, item.fund2])));
  const matrix = funds.map((fund1) =>
    funds.map((fund2) => {
      if (fund1 === fund2) return 100;
      const overlap = data.find(
        (item: any) =>
          (item.fund1 === fund1 && item.fund2 === fund2) ||
          (item.fund1 === fund2 && item.fund2 === fund1)
      );
      return overlap ? overlap.overlapPercent : 0;
    })
  );
  const [flashIndex, setFlashIndex] = useState(-1);
  const maxIndex = useMemo(() => funds.length * funds.length, [funds.length]);

  useEffect(() => {
    if (!reveal || maxIndex === 0) return;
    setFlashIndex(-1);
    let current = -1;
    const timer = setInterval(() => {
      current += 1;
      setFlashIndex(current);
      if (current >= maxIndex) clearInterval(timer);
    }, 110);
    return () => clearInterval(timer);
  }, [reveal, maxIndex]);

  const getColor = (value: number) => {
    if (value >= 100) return "bg-[#374151] text-white";
    if (value > 60) return "bg-[#DC2626] text-white";
    if (value > 35) return "bg-[#D97706] text-white";
    if (value > 15) return "bg-[#059669] text-white";
    return "bg-white/5 text-white/40";
  };

  return (
    <div className="liquid-glass p-6 rounded-2xl overflow-x-auto">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white">Fund Overlap Heatmap</h3>
          <p className="text-xs text-white/60 mt-1">Red means high overlap. Green means lower overlap.</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-semibold text-white/60">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-[#DC2626] inline-block"></span>High &gt;60%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-[#D97706] inline-block"></span>Med &gt;35%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-[#059669] inline-block"></span>Low &gt;15%
          </span>
        </div>
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `160px repeat(${funds.length}, 52px)` }}>
        <div />
        {funds.map((fund) => (
          <div key={fund} className="text-center text-[9px] font-bold text-white/40 truncate leading-tight px-1">
            {fund}
          </div>
        ))}
        {matrix.map((row, i) => (
          <Fragment key={funds[i]}>
            <div className="text-[10px] font-semibold text-white/60 truncate self-center pr-2">{funds[i]}</div>
            {row.map((value, j) => {
              const cellIndex = i * funds.length + j;
              const isFlash = reveal && cellIndex <= flashIndex && value > 60 && i !== j;
              return (
                <div
                  key={`${funds[i]}-${funds[j]}`}
                  className={`w-12 h-12 rounded-lg ${getColor(value)} flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isFlash ? "ring-2 ring-red-300 animate-pulse" : ""
                  }`}
                  title={
                    i === j
                      ? `${funds[i]} vs ${funds[j]}: self-overlap`
                      : `${funds[i]} vs ${funds[j]}: ${value}% overlap`
                  }
                >
                  {value}%
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
