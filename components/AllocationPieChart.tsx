"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS = ["#E8651A", "#F59E0B", "#059669", "#3B82F6", "#8B5CF6", "#EC4899"];

export default function AllocationPieChart({ data }: { data: any[] }) {
  const grouped = data.reduce((acc: Record<string, number>, fund) => {
    const key = fund.category;
    acc[key] = (acc[key] || 0) + fund.allocationPercent;
    return acc;
  }, {});

  const chartData = Object.entries(grouped).map(([name, value]) => ({
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
          <Tooltip
            formatter={(value: number) => [`${value.toFixed(1)}%`, "Allocation"]}
            contentStyle={{
              backgroundColor: "#000000",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#ffffff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
            }}
          />
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
