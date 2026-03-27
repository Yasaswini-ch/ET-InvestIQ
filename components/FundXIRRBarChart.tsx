"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

function shortName(name: string) {
  return name
    .replace("Fund - Direct Growth", "")
    .replace("Fund - ELSS Direct Growth", "ELSS")
    .replace("Direct Growth", "")
    .trim();
}

export default function FundXIRRBarChart({ data }: { data: any[] }) {
  const chartData = data.map((fund) => ({
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
          <Tooltip
            contentStyle={{
              backgroundColor: "#000000",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#ffffff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
            }}
            formatter={(value: number, _name, item: any) => [`${value.toFixed(2)}%`, item.payload.fullName]}
          />
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
