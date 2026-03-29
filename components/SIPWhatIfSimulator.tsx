"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRightLeft, RefreshCcw } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrencyINR } from "@/lib/currency";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { STORAGE_KEYS, readStoredJson } from "@/lib/storage";
import { WhatIfPeriod, WhatIfResponse } from "@/lib/types/whatif";

interface XrayFundItem {
  name: string;
}

interface XraySnapshot {
  funds?: XrayFundItem[];
}

const PERIODS: WhatIfPeriod[] = ["1Y", "3Y", "5Y"];
const FALLBACK_OPTIONS = ["HDFCBANK", "INFY", "RELIANCE", "TCS", "ICICIBANK"];

function SummaryCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className={`liquid-glass rounded-2xl border p-4 ${accent ?? "border-white/10"}`}>
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function readFundOptions(): string[] {
  const modern = readStoredJson<XraySnapshot>(STORAGE_KEYS.xrayResult);
  const legacy = readStoredJson<XraySnapshot>(STORAGE_KEYS.legacyXrayResult);
  const funds = modern?.funds ?? legacy?.funds ?? [];
  const names = funds.map((fund) => fund.name).filter(Boolean);
  return names.length ? names : FALLBACK_OPTIONS;
}

export default function SIPWhatIfSimulator() {
  const [fundOptions, setFundOptions] = useState<string[]>(FALLBACK_OPTIONS);
  const [fundA, setFundA] = useState(FALLBACK_OPTIONS[0]);
  const [fundB, setFundB] = useState(FALLBACK_OPTIONS[1]);
  const [amount, setAmount] = useState(10000);
  const [period, setPeriod] = useState<WhatIfPeriod>("3Y");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<WhatIfResponse | null>(null);

  useEffect(() => {
    const options = readFundOptions();
    setFundOptions(options);
    setFundA(options[0] ?? FALLBACK_OPTIONS[0]);
    setFundB(options[1] ?? options[0] ?? FALLBACK_OPTIONS[1]);
  }, []);

  const hasResult = Boolean(result?.chartData?.length);
  const deltaTone = useMemo(() => {
    if (!result) return "text-white";
    return result.delta >= 0 ? "text-emerald-300" : "text-red-300";
  }, [result]);

  const runSimulation = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/whatif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fundA, fundB, amount, period }),
      });
      const payload = (await response.json().catch(() => null)) as WhatIfResponse | null;
      if (!payload) throw new Error("Simulation unavailable");
      setResult(payload);
    } catch {
      setError("We could not fetch live performance right now. Retry to refresh the simulation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="liquid-glass rounded-2xl border border-white/10 p-5 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-white/45">If I had invested less in</label>
            <select value={fundA} onChange={(event) => setFundA(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none">
              {fundOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-white/45">and more in</label>
            <select value={fundB} onChange={(event) => setFundB(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none">
              {fundOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-white/45">Amount shifted</label>
            <input
              type="number"
              value={amount}
              min={1000}
              step={1000}
              onChange={(event) => setAmount(Math.max(0, Number(event.target.value) || 0))}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-white/45">Time period</label>
            <div className="mt-2 flex gap-2 rounded-2xl border border-white/10 bg-black/30 p-1">
              {PERIODS.map((option) => (
                <button
                  key={option}
                  onClick={() => setPeriod(option)}
                  className={`flex-1 rounded-xl px-3 py-2 text-sm ${period === option ? "bg-emerald-500 text-black" : "text-white/65 hover:text-white"}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={() => void runSimulation()}
            disabled={loading || !fundA || !fundB || amount <= 0}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowRightLeft className="w-4 h-4" />
            {loading ? "Running..." : "Run Simulation"}
          </button>
          {hasResult && (
            <button
              onClick={() => void runSimulation()}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-3 text-sm text-white/70 hover:text-white"
            >
              <RefreshCcw className="w-4 h-4" />
              Refresh
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((item) => (
            <div key={item} className="shimmer h-24 rounded-2xl" />
          ))}
          <div className="shimmer md:col-span-3 h-72 rounded-2xl" />
        </div>
      )}

      {error && !loading && (
        <div className="liquid-glass rounded-2xl border border-red-500/20 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-red-300">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
          <button onClick={() => void runSimulation()} className="text-xs text-white/70 hover:text-white">Retry</button>
        </div>
      )}

      {!loading && !hasResult && !error && (
        <div className="liquid-glass rounded-2xl border border-white/10 p-8 text-center text-white/55">
          Run a scenario to compare your actual path versus a shifted allocation using historical price behaviour.
        </div>
      )}

      {result && hasResult && (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4">
          <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard label="Actual Corpus" value={formatCurrencyINR(result.actualCorpus)} />
            <SummaryCard label="Simulated Corpus" value={formatCurrencyINR(result.simulatedCorpus)} accent={result.delta >= 0 ? "border-emerald-500/20" : "border-red-500/20"} />
            <SummaryCard label="Delta" value={`${formatCurrencyINR(result.delta)} (${result.deltaPercent >= 0 ? "+" : ""}${result.deltaPercent.toFixed(2)}%)`} accent={result.delta >= 0 ? "border-emerald-500/20" : "border-red-500/20"} />
          </motion.div>

          <motion.div variants={staggerItem} className="liquid-glass rounded-2xl border border-white/10 p-4 md:p-6">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.chartData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 12 }} minTickGap={24} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 12 }} tickFormatter={(value: number) => `${Math.round(value / 1000)}k`} />
                  <Tooltip formatter={(value: number) => formatCurrencyINR(value)} />
                  <Line type="monotone" dataKey="actual" stroke="#94A3B8" strokeWidth={2.5} dot={false} name="Actual" />
                  <Line type="monotone" dataKey="simulated" stroke="#34D399" strokeWidth={2.5} dot={false} name="Simulated" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={staggerItem} className="liquid-glass rounded-2xl border border-white/10 p-5">
            <p className={`text-sm leading-relaxed ${deltaTone}`}>{result.aiInterpretation}</p>
            {result.disclaimer && <p className="mt-2 text-xs text-white/35">{result.disclaimer}</p>}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

