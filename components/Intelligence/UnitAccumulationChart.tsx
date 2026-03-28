"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  monthlyAmount: number;
  bonusUnits: number;
  normalUnitsAtPeak: number;
}

export default function UnitAccumulationChart({ monthlyAmount, bonusUnits, normalUnitsAtPeak }: Props) {
  // Generate 12 months visualization
  const data = Array.from({ length: 12 }).map((_, i) => {
    const month = i + 1;
    return {
      month: `M${month}`,
      continue: (normalUnitsAtPeak + bonusUnits) * month,
      pause: 0
    };
  });

  return (
    <div className="w-full h-[260px] mt-4">
       <p className="text-center text-white/50 text-xs font-bold uppercase tracking-widest mb-4">Unit accumulation over next 12 months: Continue vs Pause</p>
       <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
             <defs>
               <linearGradient id="colorContinue" x1="0" y1="0" x2="0" y2="1">
                 <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                 <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
               </linearGradient>
             </defs>
             <XAxis dataKey="month" stroke="#475569" fontSize={10} tickMargin={8} />
             <YAxis stroke="#475569" fontSize={10} tickFormatter={(val) => Math.floor(val).toString()} />
             <Tooltip 
               contentStyle={{ backgroundColor: "#000", border: "1px solid #10B981", borderRadius: "8px" }}
               formatter={(val: number) => Math.floor(val).toLocaleString("en-IN") + " Units"}
             />
             <Area type="monotone" dataKey="continue" name="Units if continuing SIP" stroke="#10B981" strokeWidth={2} fill="url(#colorContinue)" />
             <Area type="monotone" dataKey="pause" name="Units if tracking parked cash" stroke="#EF4444" strokeWidth={2} fill="transparent" />
          </AreaChart>
       </ResponsiveContainer>
    </div>
  );
}
