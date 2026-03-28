"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart
} from "recharts";
import { ArrowRight, Calculator, Home, GraduationCap, Plane, Coffee, AlertCircle } from "lucide-react";

import PageHeader from "@/components/PageHeader";

export default function SIPPage() {
  const [activeTab, setActiveTab] = useState<"timemachine" | "goal">("timemachine");

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-4xl mx-auto space-y-8">
      <PageHeader
        title="SIP Tools"
        description="Rewind the market or plan for the future with AI."
      />

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab("timemachine")}
          className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "timemachine" ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          SIP Time Machine
        </button>
        <button
          onClick={() => setActiveTab("goal")}
          className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "goal" ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Plan My Goal
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {activeTab === "timemachine" ? <SIPTimeMachine /> : <GoalCalculator />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function SIPTimeMachine() {
  const [fundName, setFundName] = useState("Parag Parikh Flexi Cap");
  const [monthlyAmount, setMonthlyAmount] = useState<number>(5000);
  const [startMonth, setStartMonth] = useState("01");
  const [startYear, setStartYear] = useState("2018");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  async function calculate() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/sip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fundName, monthlyAmount, startMonth, startYear }),
      });
      if (!res.ok) throw new Error("Calculation failed");
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Failed to calculate");
    } finally {
      setLoading(false);
    }
  }

  const formatLakhs = (val: number) => `₹${(val / 100000).toFixed(1)}L`;

  return (
    <div className="space-y-6">
      <div className="liquid-glass p-6 rounded-2xl border border-white/10 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Fund Name</label>
          <input
            type="text"
            className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            value={fundName}
            onChange={(e) => setFundName(e.target.value)}
            placeholder="e.g. Parag Parikh Flexi Cap"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Monthly SIP (₹)</label>
          <input
            type="number"
            className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            value={monthlyAmount}
            onChange={(e) => setMonthlyAmount(Number(e.target.value))}
          />
        </div>
        <div className="flex gap-2">
          <div className="w-1/2">
            <label className="block text-xs text-slate-400 mb-1">Month</label>
            <select
              className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i} value={String(i + 1).padStart(2, "0")}>
                  {String(i + 1).padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>
          <div className="w-1/2">
            <label className="block text-xs text-slate-400 mb-1">Year</label>
            <input
              type="number"
              className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
              min="2010"
              max="2024"
            />
          </div>
        </div>
        <div className="flex items-end">
          <button
            onClick={calculate}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-medium p-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? "Calculating..." : "Calculate"}
            {!loading && <Calculator className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="liquid-glass rounded-xl p-4 border border-red-500/30 text-red-400 text-sm flex gap-2">
          <AlertCircle className="w-5 h-5"/> {error}
        </div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="liquid-glass rounded-2xl p-6 text-center border border-emerald-500/30 bg-emerald-500/5">
            <h2 className="font-heading italic text-3xl text-white">
              "{result.verdict}"
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Invested" value={formatLakhs(result.totalInvested)} />
            <MetricCard label="Corpus" value={formatLakhs(result.currentCorpus)} highlight />
            <MetricCard label="Wealth Gained" value={formatLakhs(result.wealthGained)} />
            <MetricCard label="Achieved XIRR" value={`${result.xirr}%`} />
          </div>

          <div className="liquid-glass rounded-2xl p-6 border border-white/10 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={result.monthlyData}>
                <defs>
                  <linearGradient id="colorCorpus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#475569" fontSize={10} tickMargin={8} minTickGap={30} />
                <YAxis stroke="#475569" fontSize={10} tickFormatter={(val) => `₹${(val/100000).toFixed(0)}L`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#000", border: "1px solid #10B981", borderRadius: "8px" }}
                  formatter={(val: number) => `₹${val.toLocaleString("en-IN")}`}
                />
                <Area type="monotone" dataKey="corpus" stroke="#10B981" fillOpacity={1} fill="url(#colorCorpus)" />
                <Area type="monotone" dataKey="invested" stroke="#3B82F6" strokeWidth={2} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="liquid-glass rounded-xl p-5 border border-white/5">
                <span className="text-yellow-400 text-lg block mb-2">⚖️ Comparison</span>
                <p className="text-slate-300 text-sm">vs Fixed Deposit (6.5%): you earned <span className="text-emerald-400 font-bold">₹{(result.vsFixedDeposit / 100000).toFixed(1)}L MORE</span></p>
                <p className="text-slate-300 text-sm mt-1">vs Nifty 50 index: you beat by <span className="text-emerald-400 font-bold">{result.vsNifty50}%</span></p>
             </div>
             
             <div className="liquid-glass rounded-xl p-5 border border-emerald-500/20 bg-emerald-500/5 group flex flex-col justify-between hover:bg-emerald-500/10 transition-colors">
                <div>
                  <span className="text-emerald-400 text-sm font-medium mb-1 block">Continue same SIP for 10 more years →</span>
                  <p className="text-slate-300 text-sm">₹{(result.futureProjection.nextTenYears.totalInvested / 100000).toFixed(1)}L invested → <span className="text-emerald-400 text-xl font-bold font-heading italic ml-1">₹{(result.futureProjection.nextTenYears.projectedCorpus / 100000).toFixed(1)}L projected corpus</span></p>
                </div>
                <a href="https://etmarkets.com" target="_blank" className="text-emerald-400 text-xs mt-3 flex items-center gap-1 group-hover:underline">
                  Start SIP on ET Markets <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </a>
             </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function GoalCalculator() {
  const [goal, setGoal] = useState("Home");
  const [targetAmount, setTargetAmount] = useState<number>(5000000); // 50L
  const [years, setYears] = useState<number>(15);
  const [existingPortfolio, setExistingPortfolio] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  const goals = [
    { name: "Home", icon: Home },
    { name: "Education", icon: GraduationCap },
    { name: "Travel", icon: Plane },
    { name: "Retirement", icon: Coffee }
  ];

  async function calculateGoal() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, targetAmount, years, existingPortfolioValue: existingPortfolio }),
      });
      if (!res.ok) throw new Error("Goal planning failed");
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Failed to generate plan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="liquid-glass p-6 rounded-2xl border border-white/10">
        <label className="block text-sm text-slate-300 mb-3 text-center">What's your goal?</label>
        <div className="flex gap-2 justify-center flex-wrap mb-6">
          {goals.map((g) => (
             <button 
                key={g.name}
                onClick={() => setGoal(g.name)}
                className={`py-2 px-4 rounded-xl flex items-center gap-2 border transition-all text-sm ${goal === g.name ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-black/50 border-white/10 text-slate-400 hover:text-white"}`}
             >
                <g.icon className="w-4 h-4" /> {g.name}
             </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
           <div>
              <label className="block text-xs text-slate-400 mb-1">Target amount (₹)</label>
              <input
                type="number"
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                value={targetAmount}
                onChange={(e) => setTargetAmount(Number(e.target.value))}
              />
           </div>
           <div>
              <label className="block text-xs text-slate-400 mb-1">In how many years?</label>
              <input
                type="number"
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
              />
           </div>
           <div>
              <label className="block text-xs text-slate-400 mb-1">Existing investments (₹, optional)</label>
              <input
                type="number"
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                value={existingPortfolio}
                onChange={(e) => setExistingPortfolio(Number(e.target.value))}
              />
           </div>
        </div>

        <button
            onClick={calculateGoal}
            disabled={loading}
            className="w-full max-w-xs mx-auto block bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-medium p-3 rounded-xl transition-colors text-center"
          >
            {loading ? "Generating Plan..." : "Calculate My Plan →"}
        </button>
      </div>

      {error && (
        <div className="liquid-glass rounded-xl p-4 border border-red-500/30 text-red-400 text-sm flex gap-2">
          <AlertCircle className="w-5 h-5"/> {error}
        </div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
           <div className="liquid-glass rounded-2xl p-6 text-center border border-white/10">
              <h2 className="text-xl md:text-2xl text-white">
                You need <span className="font-bold text-emerald-400">₹{result.requiredMonthlySIP.toLocaleString("en-IN")}/month</span> to reach 
                <span className="font-bold"> ₹{(result.targetAmount/100000).toFixed(1)}L</span> in {result.years} years.
              </h2>
           </div>

           <h3 className="text-slate-300 text-sm font-medium mt-8">Recommended split:</h3>
           
           <div className="space-y-3">
              {result.fundAllocation.map((alloc: any, i: number) => (
                 <div key={i} className="liquid-glass rounded-xl border border-white/10 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          <span className="text-emerald-400 font-bold whitespace-nowrap">₹{alloc.monthlyAmount.toLocaleString("en-IN")}/mo</span>
                          <ArrowRight className="text-slate-600 w-3 h-3" />
                          <span className="text-white font-medium">{alloc.fundName} ({alloc.percentage}%)</span>
                       </div>
                       <p className="text-slate-400 text-xs">— {alloc.reason}</p>
                    </div>
                    
                    <a href={alloc.etMarketsLink} target="_blank" className="text-xs text-slate-400 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/5 hover:text-white transition-colors flex items-center justify-center gap-1 shrink-0">
                       View on ET Markets <ArrowRight className="w-3 h-3" />
                    </a>
                 </div>
              ))}
           </div>
        </motion.div>
      )}
    </div>
  );
}

function MetricCard({ label, value, highlight = false }: { label: string, value: string | number, highlight?: boolean }) {
  return (
    <div className={`liquid-glass rounded-xl p-4 border ${highlight ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5'}`}>
       <p className={`text-2xl font-bold font-heading ${highlight ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
       <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{label}</p>
    </div>
  );
}
