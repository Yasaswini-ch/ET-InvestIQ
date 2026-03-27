"use client";

import { formatINR } from "@/lib/utils";

export default function FundDetailsTable({ funds }: { funds: any[] }) {
  const getRecommendationConfig = (rec: string) => {
    switch (rec) {
      case "increase":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-400/20";
      case "hold":
        return "bg-white/5 text-white/60 border border-white/10";
      case "reduce":
        return "bg-yellow-500/10 text-yellow-400 border border-yellow-400/20";
      case "exit":
        return "bg-red-500/10 text-red-400 border border-red-400/20";
      default:
        return "bg-white/5 text-white/60 border border-white/10";
    }
  };

  return (
    <div className="liquid-glass rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10 bg-white/5">
        <h3 className="text-base font-bold text-white">Fund Details Table</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              {["Name", "Category", "Value", "XIRR", "Action Badge"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-white/60 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {funds.map((fund, index) => (
              <tr key={index} className="border-b border-white/10 last:border-0 hover:bg-white/5 transition-colors">
                <td className="px-5 py-4 text-sm font-semibold text-white">{fund.name}</td>
                <td className="px-5 py-4">
                  <span className="text-xs px-2.5 py-1 bg-white/5 text-white/80 rounded-lg border border-white/10 font-medium">
                    {fund.category}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm font-semibold text-white">{formatINR(fund.currentValue)}</td>
                <td className="px-5 py-4">
                  <span className={`text-sm font-bold ${fund.xirr >= 12 ? "text-emerald-400" : fund.xirr >= 8 ? "text-yellow-400" : "text-red-400"}`}>
                    {fund.xirr.toFixed(2)}%
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold capitalize ${getRecommendationConfig(fund.recommendation)}`}>
                    {fund.recommendation}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
