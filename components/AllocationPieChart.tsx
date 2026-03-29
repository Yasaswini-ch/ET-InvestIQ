"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { TooltipProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

const COLORS = ["#E8651A", "#F59E0B", "#059669", "#3B82F6", "#8B5CF6", "#EC4899"];

interface AllocationFund {
  category: string;
  allocationPercent: number;
}

interface AllocationSlice {
  name: string;
  value: number;
}

function AllocationTooltip({ active, payload }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0];
  const label = typeof entry.name === "string" ? entry.name : "Allocation";
  const value = typeof entry.value === "number" ? entry.value : Number(entry.value ?? 0);

  return (
    <div className="rounded-xl border border-white/10 bg-[#050816] px-3 py-2 shadow-2xl">
      <p className="text-xs font-semibold text-white">{label}</p>
      <p className="mt-1 text-xs text-emerald-300">{value.toFixed(1)}% of portfolio</p>
    </div>
  );
}

export default function AllocationPieChart({ data }: { data: AllocationFund[] }) {
  const grouped = data.reduce((acc: Record<string, number>, fund) => {
    const key = fund.category;
    acc[key] = (acc[key] || 0) + fund.allocationPercent;
    return acc;
  }, {});

  const chartData: AllocationSlice[] = Object.entries(grouped).map(([name, value]) => ({
    name,
    value: Number(value.toFixed(1)),
  }));

  return (
    <div className="liquid-glass p-6 rounded-2xl h-80">
      <h3 className="text-base font-bold text-white mb-4">Allocation Pie Chart</h3>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={90}
            dataKey="value"
            nameKey="name"
          >
            {chartData.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<AllocationTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "11px", fontWeight: 600 }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
