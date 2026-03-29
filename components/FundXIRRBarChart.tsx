"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { TooltipProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

interface FundXirrRow {
  name: string;
  xirr: number;
  fullName: string;
}

function shortName(name: string) {
  return name
    .replace("Fund - Direct Growth", "")
    .replace("Fund - ELSS Direct Growth", "ELSS")
    .replace("Direct Growth", "")
    .trim();
}

function FundXirrTooltip({ active, payload }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0];
  const value = typeof entry.value === "number" ? entry.value : Number(entry.value ?? 0);
  const rawPayload = entry.payload as FundXirrRow | undefined;

  return (
    <div className="rounded-xl border border-white/10 bg-[#050816] px-3 py-2 shadow-2xl">
      <p className="text-xs font-semibold text-white">{rawPayload?.fullName ?? "Fund"}</p>
      <p className="mt-1 text-xs text-emerald-300">{value.toFixed(2)}% XIRR</p>
    </div>
  );
}

export default function FundXIRRBarChart({ data }: { data: Array<{ name: string; xirr: number }> }) {
  const chartData: FundXirrRow[] = data.map((fund) => ({
    name: shortName(fund.name),
    xirr: fund.xirr,
    fullName: fund.name,
  }));

  return (
    <div className="liquid-glass p-6 rounded-2xl h-80">
      <h3 className="text-base font-bold text-white mb-4">Fund XIRR Bar Chart</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={chartData} layout="vertical" barSize={18} margin={{ left: 12, right: 12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickLine={false}
            unit="%"
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            width={150}
          />
          <Tooltip content={<FundXirrTooltip />} />
          <Bar dataKey="xirr" radius={[0, 6, 6, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={entry.fullName}
                fill={entry.xirr >= 15 ? "#059669" : entry.xirr >= 10 ? "#E8651A" : "#DC2626"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
