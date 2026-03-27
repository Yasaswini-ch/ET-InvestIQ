"use client";

import { useEffect, useState } from "react";

interface MetricCardProps {
  label: string;
  value: number;
  formatter?: (value: number) => string;
}

export default function MetricCard({
  label,
  value,
  formatter = (current) => current.toLocaleString("en-IN"),
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setDisplayValue(value * progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <div className="liquid-glass p-5 rounded-xl hover:bg-white/5 transition-all">
      <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-3xl font-bold text-white">{formatter(displayValue)}</p>
    </div>
  );
}
