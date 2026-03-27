"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { formatINR } from "@/lib/utils";

export default function RebalancingPlan({ data, typewriter = false }: { data: any; typewriter?: boolean }) {
  const urgencyConfig = {
    high: {
      border: "border-red-400/20",
      bg: "bg-red-500/10",
      badge: "bg-red-500/10 text-red-400 border border-red-400/20",
      icon: <AlertTriangle className="w-4 h-4" />,
    },
    medium: {
      border: "border-yellow-400/20",
      bg: "bg-yellow-500/10",
      badge: "bg-yellow-500/10 text-yellow-400 border border-yellow-400/20",
      icon: <Info className="w-4 h-4" />,
    },
    low: {
      border: "border-emerald-400/20",
      bg: "bg-emerald-500/10",
      badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-400/20",
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
  };

  const config = urgencyConfig[data.urgency as keyof typeof urgencyConfig] || urgencyConfig.medium;
  const [typedSummary, setTypedSummary] = useState(typewriter ? "" : data.summary);

  useEffect(() => {
    if (!typewriter) {
      setTypedSummary(data.summary);
      return;
    }
    setTypedSummary("");
    let index = 0;
    const summary = String(data.summary || "");
    const timer = setInterval(() => {
      index += 1;
      setTypedSummary(summary.slice(0, index));
      if (index >= summary.length) clearInterval(timer);
    }, 18);
    return () => clearInterval(timer);
  }, [data.summary, typewriter]);

  return (
    <div className={`liquid-glass rounded-2xl border ${config.border} overflow-hidden`}>
      <div className={`px-6 py-4 ${config.bg} border-b ${config.border} flex items-center justify-between`}>
        <h3 className="text-base font-bold text-white">AI Rebalancing Plan</h3>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${config.badge}`}>
          {config.icon}
          Urgency: {data.urgency.toUpperCase()}
        </div>
      </div>

      <div className="p-6">
        <p className="text-sm text-white/80 mb-6 leading-relaxed">
          {typedSummary}
          {typewriter && typedSummary.length < String(data.summary || "").length ? (
            <span className="inline-block w-1.5 h-4 bg-emerald-400 ml-1 align-[-2px] animate-pulse" />
          ) : null}
        </p>

        <div className="space-y-3 mb-6">
          {data.actions.map((action: any, index: number) => (
            <div key={index} className="flex items-start gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="w-7 h-7 bg-emerald-500 hover:bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {index + 1}
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {action.action} {action.fund}
                </p>
                <p className="text-xs text-white/60 mt-0.5 leading-relaxed">{action.reason}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-emerald-500/10 border border-emerald-400/20 rounded-xl">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Expected Impact</p>
            <p className="text-sm text-white/80 leading-relaxed">{data.expectedImpact}</p>
          </div>
          <div className="p-4 bg-emerald-500/10 border border-emerald-400/20 rounded-xl">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Estimated Savings</p>
            <p className="text-lg font-bold text-white">{formatINR(data.estimatedAnnualSavings)}/year</p>
          </div>
        </div>
      </div>
    </div>
  );
}
