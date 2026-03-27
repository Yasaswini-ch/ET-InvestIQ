'use client';

import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface PortfolioChartProps {
  data: any[];
  type: 'allocation' | 'xirr';
  colors?: string[];
}

const defaultColors = ['#E8651A', '#059669', '#D97706', '#DC2626', '#8B5CF6', '#EC4899'];

export default function PortfolioChart({ data, type, colors = defaultColors }: PortfolioChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-[#E8DDD2] rounded-lg p-3 shadow-md">
          <p className="text-[#111827] font-semibold text-sm">{payload[0].name}</p>
          <p className="text-[#E8651A] font-bold text-sm">
            {type === 'allocation' ? '₹' : ''}{payload[0].value.toLocaleString('en-IN')}
            {type === 'xirr' ? '%' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white border border-[#E8DDD2] rounded-2xl p-6 shadow-sm h-full"
    >
      <h3 className="font-semibold text-base text-[#111827] mb-4">
        {type === 'allocation' ? 'Portfolio Allocation' : 'Fund-wise XIRR'}
      </h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'allocation' ? (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8DDD2" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#6B7280"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                stroke="#6B7280"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
                animationBegin={0}
                animationDuration={1000}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-3 mt-4">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="text-[#6B7280] text-xs">{entry.name}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
