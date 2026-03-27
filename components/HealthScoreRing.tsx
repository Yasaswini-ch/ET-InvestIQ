"use client";

import { useEffect, useState } from 'react';

export default function HealthScoreRing({ score }: { score: number }) {
  const [offset, setOffset] = useState(2 * Math.PI * 50);
  const circumference = 2 * Math.PI * 50;

  useEffect(() => {
    const progress = score / 100;
    const newOffset = circumference * (1 - progress);
    setOffset(newOffset);
  }, [score, circumference]);

  const scoreColor = score > 75 ? '#059669' : score > 50 ? '#D97706' : '#DC2626';
  const trackColor = 'rgba(255,255,255,0.1)';

  return (
    <div className="relative w-32 h-32">
      <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke={trackColor}
          strokeWidth="9"
        />
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke={scoreColor}
          strokeWidth="9"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <p className="text-2xl font-bold text-white">{score}</p>
        <p className="text-[10px] font-bold text-white/60">/100</p>
      </div>
    </div>
  );
}
