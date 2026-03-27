'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface FundRowProps {
  fund: {
    name: string;
    amc: string;
    category: string;
    currentValue: number;
    xirr: number;
    recommendation: 'hold' | 'increase' | 'reduce' | 'exit';
    recommendationReason: string;
    overlapScore: number;
    expenseRatio: number;
    allocationPercent: number;
  };
}

const recommendationConfig = {
  hold: { bg: 'bg-[#F7F0E8]', text: 'text-[#6B7280]', border: 'border-[#E8DDD2]', icon: Minus },
  increase: { bg: 'bg-green-50', text: 'text-[#059669]', border: 'border-green-100', icon: TrendingUp },
  reduce: { bg: 'bg-yellow-50', text: 'text-[#D97706]', border: 'border-yellow-100', icon: TrendingDown },
  exit: { bg: 'bg-red-50', text: 'text-[#DC2626]', border: 'border-red-100', icon: TrendingDown },
};

function formatINR(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return `₹${amount.toLocaleString()}`;
}

export function FundRow({ fund }: FundRowProps) {
  const config = recommendationConfig[fund.recommendation];
  const Icon = config.icon;

  return (
    <div className="flex flex-col gap-3 p-4 bg-[#F7F0E8] rounded-xl border border-[#E8DDD2] hover:border-[#E8651A]/30 hover:bg-white transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-[#111827] truncate" title={fund.name}>
            {fund.name}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-[#6B7280]">{fund.amc}</span>
            <span className="text-xs px-2 py-0.5 bg-white border border-[#E8DDD2] rounded text-[#374151]">
              {fund.category}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-[#111827]">{formatINR(fund.currentValue)}</div>
          <div className={`text-xs font-semibold ${fund.xirr >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
            {fund.xirr >= 0 ? '+' : ''}{fund.xirr.toFixed(1)}% XIRR
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#E8DDD2]">
        <div className="flex items-center gap-4 text-xs text-[#6B7280]">
          <span>Expense: {fund.expenseRatio.toFixed(2)}%</span>
          <span>Overlap: {fund.overlapScore}%</span>
          <span>Alloc: {fund.allocationPercent.toFixed(1)}%</span>
        </div>

        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${config.bg} ${config.text} ${config.border}`}>
          <Icon className="w-3 h-3" />
          <span className="text-xs font-semibold uppercase">{fund.recommendation}</span>
        </div>
      </div>

      <p className="text-xs text-[#6B7280] leading-relaxed">
        {fund.recommendationReason}
      </p>
    </div>
  );
}
