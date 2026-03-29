"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coffee,
  GraduationCap,
  Home,
  Loader2,
  Minus,
  Plane,
  ShieldAlert,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import SIPWhatIfSimulator from "@/components/SIPWhatIfSimulator";
import { formatINR } from "@/lib/formatCurrency";
import { samplePortfolio } from "@/lib/samplePortfolio";
import { SipOptimizerResponse, SipRiskAppetite } from "@/lib/sipOptimizer";
import { STORAGE_KEYS } from "@/lib/storage";

type TabName = "timemachine" | "goal" | "stress" | "whatif";

type PortfolioFund = {
  name: string;
  category: string;
  allocationPercent: number;
};

type PortfolioContext = {
  currentValue: number;
  totalInvested: number;
  riskProfile: string;
  funds: PortfolioFund[];
};

type AllocationState = {
  largeCap: number;
  midCap: number;
  smallCap: number;
  debt: number;
  gold: number;
};

type CrashScenario = {
  name: string;
  period: string;
  crashMonths: number;
  niftyDrop: number;
  drops: AllocationState;
  recoveryMonths: AllocationState;
  whatSmartInvestorsDid: string;
  whatPanickedInvestorsDid: string;
  lesson: string;
};

type ScenarioResult = CrashScenario & {
  portfolioDrop: number;
  portfolioLoss: number;
  estimatedRecoveryMonths: number;
  bestAsset: string;
  worstAsset: string;
  weightedDrops: Record<keyof AllocationState, number>;
};

const PRESETS = [
  { label: "Retirement", goalName: "Retirement Corpus", defaultTimeline: 25, defaultRisk: "moderate" as SipRiskAppetite },
  { label: "Child Education", goalName: "Child Higher Education", defaultTimeline: 15, defaultRisk: "moderate" as SipRiskAppetite },
  { label: "House", goalName: "House Down Payment", defaultTimeline: 7, defaultRisk: "conservative" as SipRiskAppetite },
  { label: "Wealth", goalName: "Wealth Creation", defaultTimeline: 10, defaultRisk: "aggressive" as SipRiskAppetite },
  { label: "Emergency", goalName: "Emergency Fund", defaultTimeline: 2, defaultRisk: "conservative" as SipRiskAppetite },
  { label: "Travel", goalName: "Dream Vacation", defaultTimeline: 3, defaultRisk: "conservative" as SipRiskAppetite },
] as const;

const QUICK_SIP_AMOUNTS = [1000, 2500, 5000, 10000, 25000] as const;
const TIMELINE_PRESETS = [5, 10, 15, 20, 30] as const;
const ALLOCATION_KEYS = ["largeCap", "midCap", "smallCap", "debt", "gold"] as const;

const CRASH_SCENARIOS: CrashScenario[] = [
  {
    name: "COVID Crash",
    period: "Mar-Apr 2020",
    crashMonths: 2,
    niftyDrop: -38,
    drops: { largeCap: -35, midCap: -45, smallCap: -52, debt: -2, gold: 12 },
    recoveryMonths: { largeCap: 8, midCap: 14, smallCap: 18, debt: 1, gold: 0 },
    whatSmartInvestorsDid: "Continued SIPs and bought lump sum at the bottom.",
    whatPanickedInvestorsDid: "Cancelled SIPs and booked losses.",
    lesson: "Crashes are temporary. Recovery is inevitable.",
  },
  {
    name: "2008 Global Crisis",
    period: "Jan 2008-Mar 2009",
    crashMonths: 15,
    niftyDrop: -60,
    drops: { largeCap: -55, midCap: -65, smallCap: -72, debt: 4, gold: 18 },
    recoveryMonths: { largeCap: 24, midCap: 36, smallCap: 48, debt: 0, gold: 0 },
    whatSmartInvestorsDid: "Stayed invested, and many doubled their SIP.",
    whatPanickedInvestorsDid: "Exited entirely and missed the next bull run.",
    lesson: "The longer you stay, the more you earn.",
  },
  {
    name: "2015-16 China Slowdown",
    period: "Aug 2015-Feb 2016",
    crashMonths: 6,
    niftyDrop: -26,
    drops: { largeCap: -24, midCap: -31, smallCap: -38, debt: 1, gold: 6 },
    recoveryMonths: { largeCap: 10, midCap: 14, smallCap: 18, debt: 0, gold: 0 },
    whatSmartInvestorsDid: "Rebalanced into mid cap during the dip.",
    whatPanickedInvestorsDid: "Switched to FDs and missed the recovery.",
    lesson: "Mid cap corrections are opportunities, not exits.",
  },
  {
    name: "2022 IT Correction",
    period: "Jan-Jun 2022",
    crashMonths: 6,
    niftyDrop: -18,
    drops: { largeCap: -16, midCap: -22, smallCap: -28, debt: 2, gold: 4 },
    recoveryMonths: { largeCap: 6, midCap: 10, smallCap: 14, debt: 0, gold: 0 },
    whatSmartInvestorsDid: "Used the correction to add to quality large caps.",
    whatPanickedInvestorsDid: "Stopped SIPs expecting further fall.",
    lesson: "Sector corrections don't mean portfolio destruction.",
  },
];

const RISK_OPTIONS: Array<{
  label: string;
  value: SipRiskAppetite;
  description: string;
}> = [
  { label: "Conservative", value: "conservative", description: "FDs, large caps, debt. Sleep well at night." },
  { label: "Moderate", value: "moderate", description: "Balanced equity + debt. Steady growth." },
  { label: "Aggressive", value: "aggressive", description: "High equity, mid/small caps. Maximum growth." },
];

function clampNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parsePortfolioContext(value: unknown): PortfolioContext | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<PortfolioContext> & { funds?: Array<unknown> };
  if (!Array.isArray(candidate.funds)) return null;

  const funds = candidate.funds
    .map((fund) => {
      if (!fund || typeof fund !== "object") return null;
      const item = fund as Partial<PortfolioFund>;
      return {
        name: String(item.name || ""),
        category: String(item.category || ""),
        allocationPercent: clampNumber(item.allocationPercent, 0),
      };
    })
    .filter((fund): fund is PortfolioFund => Boolean(fund && fund.name));

  return {
    currentValue: clampNumber(candidate.currentValue, 0),
    totalInvested: clampNumber(candidate.totalInvested, 0),
    riskProfile: String(candidate.riskProfile || "moderate"),
    funds,
  };
}

function loadPortfolioContext(): PortfolioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      localStorage.getItem(STORAGE_KEYS.xrayResult) ??
      localStorage.getItem(STORAGE_KEYS.legacyXrayResult);
    return raw ? parsePortfolioContext(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function getDefaultAllocation(): AllocationState {
  return { largeCap: 40, midCap: 20, smallCap: 15, debt: 15, gold: 10 };
}

function deriveAllocationFromPortfolio(portfolio: PortfolioContext | null): AllocationState {
  if (!portfolio) return getDefaultAllocation();

  const buckets: AllocationState = { largeCap: 0, midCap: 0, smallCap: 0, debt: 0, gold: 0 };

  portfolio.funds.forEach((fund) => {
    const category = fund.category.toLowerCase();
    if (category.includes("large") || category.includes("index") || category.includes("bluechip")) {
      buckets.largeCap += fund.allocationPercent;
    } else if (category.includes("mid")) {
      buckets.midCap += fund.allocationPercent;
    } else if (category.includes("small")) {
      buckets.smallCap += fund.allocationPercent;
    } else if (category.includes("debt") || category.includes("liquid") || category.includes("overnight")) {
      buckets.debt += fund.allocationPercent;
    } else if (category.includes("gold")) {
      buckets.gold += fund.allocationPercent;
    } else {
      buckets.largeCap += fund.allocationPercent;
    }
  });

  const total = ALLOCATION_KEYS.reduce((sum, key) => sum + buckets[key], 0);
  if (total <= 0) return getDefaultAllocation();

  const rounded = ALLOCATION_KEYS.map((key) => ({ key, value: Math.round((buckets[key] / total) * 100) }));
  const result: AllocationState = {
    largeCap: rounded[0].value,
    midCap: rounded[1].value,
    smallCap: rounded[2].value,
    debt: rounded[3].value,
    gold: rounded[4].value,
  };

  let remainder = 100 - ALLOCATION_KEYS.reduce((sum, key) => sum + result[key], 0);
  let index = 0;
  while (remainder !== 0) {
    const key = ALLOCATION_KEYS[index % ALLOCATION_KEYS.length];
    if (remainder > 0) {
      result[key] += 1;
      remainder -= 1;
    } else if (result[key] > 0) {
      result[key] -= 1;
      remainder += 1;
    }
    index += 1;
  }

  return result;
}

function normalizeAllocation(next: AllocationState, changedKey: keyof AllocationState): AllocationState {
  const safe: AllocationState = {
    largeCap: Math.max(0, Math.min(100, Math.round(next.largeCap))),
    midCap: Math.max(0, Math.min(100, Math.round(next.midCap))),
    smallCap: Math.max(0, Math.min(100, Math.round(next.smallCap))),
    debt: Math.max(0, Math.min(100, Math.round(next.debt))),
    gold: Math.max(0, Math.min(100, Math.round(next.gold))),
  };

  const changedValue = safe[changedKey];
  const otherKeys = ALLOCATION_KEYS.filter((key) => key !== changedKey);
  const remaining = 100 - changedValue;
  const otherTotal = otherKeys.reduce((sum, key) => sum + safe[key], 0);

  if (remaining <= 0) {
    otherKeys.forEach((key) => {
      safe[key] = 0;
    });
    safe[changedKey] = 100;
    return safe;
  }

  if (otherTotal <= 0) {
    const base = Math.floor(remaining / otherKeys.length);
    let extra = remaining - base * otherKeys.length;
    otherKeys.forEach((key) => {
      safe[key] = base + (extra > 0 ? 1 : 0);
      if (extra > 0) extra -= 1;
    });
    return safe;
  }

  let assigned = 0;
  otherKeys.forEach((key, index) => {
    if (index === otherKeys.length - 1) {
      safe[key] = Math.max(0, remaining - assigned);
    } else {
      const value = Math.round((safe[key] / otherTotal) * remaining);
      safe[key] = value;
      assigned += value;
    }
  });

  const total = ALLOCATION_KEYS.reduce((sum, key) => sum + safe[key], 0);
  if (total !== 100) {
    safe.gold += 100 - total;
  }

  return safe;
}

function getSum(allocation: AllocationState) {
  return ALLOCATION_KEYS.reduce((sum, key) => sum + allocation[key], 0);
}

function getRiskBadgeTone(risk: "LOW" | "MEDIUM" | "HIGH") {
  if (risk === "LOW") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/20";
  if (risk === "MEDIUM") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/20";
  return "bg-red-500/20 text-red-400 border-red-500/20";
}

function scenarioRiskColor(drop: number) {
  if (drop < -40) return "text-red-400";
  if (drop < -25) return "text-yellow-400";
  return "text-white";
}

function scenarioBadgeColor(drop: number) {
  if (drop < -40) return "border-red-500/20 bg-red-500/5";
  if (drop < -25) return "border-yellow-500/20 bg-yellow-500/5";
  return "border-white/10 bg-white/5";
}

function formatAssetName(key: keyof AllocationState) {
  switch (key) {
    case "largeCap":
      return "Large Cap";
    case "midCap":
      return "Mid Cap";
    case "smallCap":
      return "Small Cap";
    case "debt":
      return "Debt";
    case "gold":
      return "Gold";
  }
}

function calculateScenarioResult(scenario: CrashScenario, allocation: AllocationState, totalValue: number): ScenarioResult {
  const weightedDrops = {
    largeCap: (allocation.largeCap / 100) * scenario.drops.largeCap,
    midCap: (allocation.midCap / 100) * scenario.drops.midCap,
    smallCap: (allocation.smallCap / 100) * scenario.drops.smallCap,
    debt: (allocation.debt / 100) * scenario.drops.debt,
    gold: (allocation.gold / 100) * scenario.drops.gold,
  };

  const portfolioDrop = Object.values(weightedDrops).reduce((sum, value) => sum + value, 0);
  const portfolioLoss = totalValue * (Math.abs(portfolioDrop) / 100);
  const recoveryMonths = Math.round(
    (allocation.largeCap / 100) * scenario.recoveryMonths.largeCap +
      (allocation.midCap / 100) * scenario.recoveryMonths.midCap +
      (allocation.smallCap / 100) * scenario.recoveryMonths.smallCap +
      (allocation.debt / 100) * scenario.recoveryMonths.debt +
      (allocation.gold / 100) * scenario.recoveryMonths.gold
  );

  const entries = Object.entries(weightedDrops) as Array<[keyof AllocationState, number]>;
  const worstEntry = entries.reduce((lowest, current) => (current[1] < lowest[1] ? current : lowest), entries[0]);
  const bestEntry = entries.reduce((highest, current) => (current[1] > highest[1] ? current : highest), entries[0]);

  return {
    ...scenario,
    portfolioDrop,
    portfolioLoss,
    estimatedRecoveryMonths: recoveryMonths,
    bestAsset: formatAssetName(bestEntry[0]),
    worstAsset: formatAssetName(worstEntry[0]),
    weightedDrops,
  };
}

function overallRiskFromWorstDrop(drop: number) {
  const absolute = Math.abs(drop);
  if (absolute > 45) return { label: "HIGH" as const, tone: "bg-red-500/20 text-red-400 border-red-500/20" };
  if (absolute >= 25) return { label: "MEDIUM" as const, tone: "bg-yellow-500/20 text-yellow-400 border-yellow-500/20" };
  return { label: "LOW" as const, tone: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" };
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).toISOString().slice(0, 10);
}

export default function SIPPage() {
  const [activeTab, setActiveTab] = useState<TabName>("timemachine");
  const [portfolioContext, setPortfolioContext] = useState<PortfolioContext | null>(null);

  useEffect(() => {
    setPortfolioContext(loadPortfolioContext());
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-6xl mx-auto space-y-8">
      <PageHeader
        title="SIP Tools"
        description="Model historical SIP performance, plan goal-based investing, and stress-test your portfolio through market crashes."
      />

      <div className="flex border-b border-white/10 overflow-x-auto">
        <TabButton active={activeTab === "timemachine"} onClick={() => setActiveTab("timemachine")}>
          SIP Time Machine
        </TabButton>
        <TabButton active={activeTab === "goal"} onClick={() => setActiveTab("goal")}>
          Goal Calculator
        </TabButton>
        <TabButton active={activeTab === "stress"} onClick={() => setActiveTab("stress")}>
          Portfolio Stress Test
        </TabButton>
        <TabButton active={activeTab === "whatif"} onClick={() => setActiveTab("whatif")}>
          What-If Simulator
        </TabButton>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
        >
          {activeTab === "timemachine" ? (
            <SIPTimeMachine />
          ) : activeTab === "goal" ? (
            <GoalCalculator portfolioContext={portfolioContext} />
          ) : activeTab === "stress" ? (
            <StressTest portfolioContext={portfolioContext} />
          ) : (
            <SIPWhatIfSimulator />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-40 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
        active
          ? "border-emerald-400 text-emerald-400"
          : "border-transparent text-slate-400 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function SIPTimeMachine() {
  const [fundName, setFundName] = useState("Parag Parikh Flexi Cap");
  const [monthlyAmount, setMonthlyAmount] = useState<number>(5000);
  const [startMonth, setStartMonth] = useState("01");
  const [startYear, setStartYear] = useState("2018");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    verdict: string;
    totalInvested: number;
    currentCorpus: number;
    wealthGained: number;
    xirr: number;
    monthlyData: Array<{ month: string; corpus: number; invested: number }>;
    vsFixedDeposit: number;
    vsNifty50: number;
    futureProjection: {
      nextTenYears: {
        totalInvested: number;
        projectedCorpus: number;
      };
    };
  } | null>(null);

  const calculate = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/sip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fundName, monthlyAmount, startMonth, startYear }),
      });
      const payload = (await res.json().catch(() => null)) as typeof result;
      if (!res.ok) throw new Error("Calculation failed");
      setResult(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to calculate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="liquid-glass rounded-2xl p-6 border border-white/10 grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <label className="block text-xs text-slate-400 mb-1">Monthly SIP (Rs.)</label>
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
              {Array.from({ length: 12 }).map((_, index) => (
                <option key={index} value={String(index + 1).padStart(2, "0")}>
                  {String(index + 1).padStart(2, "0")}
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
              max="2026"
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
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="liquid-glass rounded-xl p-4 border border-red-500/30 text-red-400 text-sm flex gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="liquid-glass rounded-2xl p-6 text-center border border-emerald-500/30 bg-emerald-500/5">
            <h2 className="font-heading italic text-3xl text-white">"{result.verdict}"</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Invested" value={formatINR(result.totalInvested)} />
            <MetricCard label="Corpus" value={formatINR(result.currentCorpus)} highlight />
            <MetricCard label="Wealth Gained" value={formatINR(result.wealthGained)} />
            <MetricCard label="Achieved XIRR" value={`${result.xirr}%`} />
          </div>

          <div className="liquid-glass rounded-2xl p-6 border border-white/10 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={result.monthlyData}>
                <defs>
                  <linearGradient id="colorCorpus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#475569" fontSize={10} tickMargin={8} minTickGap={30} />
                <YAxis stroke="#475569" fontSize={10} tickFormatter={(value) => formatINR(Number(value))} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#000", border: "1px solid #10B981", borderRadius: "8px" }}
                  formatter={(value: number) => formatINR(value)}
                />
                <Area type="monotone" dataKey="corpus" stroke="#10B981" fillOpacity={1} fill="url(#colorCorpus)" />
                <Area type="monotone" dataKey="invested" stroke="#3B82F6" strokeWidth={2} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="liquid-glass rounded-xl p-5 border border-white/5">
              <span className="text-yellow-400 text-lg block mb-2">Comparison</span>
              <p className="text-slate-300 text-sm">
                vs Fixed Deposit (6.5%): you earned{" "}
                <span className="text-emerald-400 font-bold">{formatINR(result.vsFixedDeposit)} MORE</span>
              </p>
              <p className="text-slate-300 text-sm mt-1">
                vs Nifty 50 index: you beat by <span className="text-emerald-400 font-bold">{result.vsNifty50}%</span>
              </p>
            </div>

            <div className="liquid-glass rounded-xl p-5 border border-emerald-500/20 bg-emerald-500/5 group flex flex-col justify-between hover:bg-emerald-500/10 transition-colors">
              <div>
                <span className="text-emerald-400 text-sm font-medium mb-1 block">Continue same SIP for 10 more years →</span>
                <p className="text-slate-300 text-sm">
                  {formatINR(result.futureProjection.nextTenYears.totalInvested)} invested →{" "}
                  <span className="text-emerald-400 text-xl font-bold font-heading italic ml-1">
                    {formatINR(result.futureProjection.nextTenYears.projectedCorpus)} projected corpus
                  </span>
                </p>
              </div>
              <a
                href="https://etmarkets.com"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 text-xs mt-3 flex items-center gap-1 group-hover:underline"
              >
                Start SIP on ET Markets <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function GoalCalculator({ portfolioContext }: { portfolioContext: PortfolioContext | null }) {
  const [selectedPreset, setSelectedPreset] = useState("");
  const [goalName, setGoalName] = useState("Retirement Corpus");
  const [monthlyAmount, setMonthlyAmount] = useState<number>(5000);
  const [timelineYears, setTimelineYears] = useState<number>(25);
  const [currentCorpus, setCurrentCorpus] = useState<number>(0);
  const [riskAppetite, setRiskAppetite] = useState<SipRiskAppetite>("moderate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SipOptimizerResponse | null>(null);
  const [autoFilledCorpus, setAutoFilledCorpus] = useState(false);

  useEffect(() => {
    const corpus = portfolioContext?.currentValue ?? samplePortfolio.currentValue;
    if (corpus > 0) {
      setCurrentCorpus(corpus);
      setAutoFilledCorpus(Boolean(portfolioContext));
    }
  }, [portfolioContext]);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setSelectedPreset(preset.label);
    setGoalName(preset.goalName);
    setTimelineYears(preset.defaultTimeline);
    setRiskAppetite(preset.defaultRisk);
  };

  const generatePlan = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/sipoptimizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyAmount,
          goalName,
          timelineYears,
          riskAppetite,
          currentCorpus,
          portfolioContext,
        }),
      });

      const data = (await res.json().catch(() => null)) as SipOptimizerResponse | null;
      if (!res.ok || !data) throw new Error("Goal planning failed");
      setResult(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to generate plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="liquid-glass rounded-2xl p-6 border border-white/10 space-y-6">
        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-1">
          <div className="flex gap-2 min-w-max">
            {PRESETS.map((preset) => {
              const active = selectedPreset === preset.label;
              return (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  className={`liquid-glass rounded-full px-4 py-2 text-sm cursor-pointer transition-colors border ${
                    active
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                      : "border-white/10 text-white/60 hover:text-white"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-3">
            <label className="block text-sm text-slate-300">Goal name</label>
            <input
              type="text"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500/30"
              placeholder="What are you saving for?"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm text-slate-300">Monthly SIP amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">₹</span>
              <input
                type="number"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                className="w-full bg-black/50 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white outline-none focus:border-emerald-500/30"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_SIP_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setMonthlyAmount(amount)}
                  className={`rounded-full px-3 py-1.5 text-xs border transition-colors ${
                    monthlyAmount === amount
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : "liquid-glass text-white/60 border-white/10 hover:text-white"
                  }`}
                >
                  ₹{amount.toLocaleString("en-IN")}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="block text-sm text-slate-300">Timeline</label>
              <span className="text-white/50 text-xs">
                {timelineYears} Years (until {currentYear + timelineYears})
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              value={timelineYears}
              onChange={(e) => setTimelineYears(Number(e.target.value))}
              className="w-full accent-emerald-400"
            />
            <div className="flex flex-wrap gap-2">
              {TIMELINE_PRESETS.map((years) => (
                <button
                  key={years}
                  onClick={() => setTimelineYears(years)}
                  className={`rounded-full px-3 py-1.5 text-xs border transition-colors ${
                    timelineYears === years
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : "liquid-glass text-white/60 border-white/10 hover:text-white"
                  }`}
                >
                  {years}Y
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="block text-sm text-slate-300">Current savings</label>
              {autoFilledCorpus && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 px-2.5 py-1 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" />
                  Auto-filled from X-Ray
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">₹</span>
              <input
                type="number"
                value={currentCorpus}
                onChange={(e) => setCurrentCorpus(Number(e.target.value))}
                className="w-full bg-black/50 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white outline-none focus:border-emerald-500/30"
                placeholder="Existing investments (₹0 if starting fresh)"
              />
            </div>
          </div>

          <div className="space-y-3 lg:col-span-2">
            <label className="block text-sm text-slate-300">Risk appetite</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {RISK_OPTIONS.map((option) => {
                const active = riskAppetite === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setRiskAppetite(option.value)}
                    className={`text-left liquid-glass rounded-xl p-4 cursor-pointer border transition-colors ${
                      active
                        ? "border-emerald-500/40 bg-emerald-500/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white font-body font-medium">{option.label}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? "text-emerald-400" : "text-white/30"}`}>
                        {option.value}
                      </span>
                    </div>
                    <p className="text-white/55 text-sm mt-2 leading-relaxed">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={generatePlan}
            disabled={loading}
            className="liquid-glass-strong rounded-full px-8 py-3 text-white font-body font-medium inline-flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate My SIP Plan
          </button>
        </div>
      </div>

      {error && (
        <div className="liquid-glass rounded-xl p-4 border border-red-500/30 text-red-400 text-sm flex gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ScenarioCard
              title="Conservative"
              rate="8% annual"
              projection={result.projections.conservative}
              borderClass="border-blue-500/30"
              accentClass="text-blue-400"
            />
            <ScenarioCard
              title="Moderate"
              rate="11% annual"
              projection={result.projections.moderate}
              borderClass="border-emerald-500/30"
              accentClass="text-emerald-400"
              badge="Most Likely"
              highlight
            />
            <ScenarioCard
              title="Aggressive"
              rate="14% annual"
              projection={result.projections.aggressive}
              borderClass="border-amber-500/30"
              accentClass="text-amber-400"
            />
          </div>

          <div className="liquid-glass rounded-2xl p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-widest">Corpus Projection Over Time</p>
                <h3 className="text-white font-heading italic text-xl">Three scenario paths</h3>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.yearlyData}>
                  <defs>
                    <linearGradient id="goalBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="goalEmerald" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="goalAmber" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="year"
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    tickFormatter={(value) => (Number(value) === 0 ? "Now" : `Yr ${value}`)}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    tickFormatter={(value) => formatINR(Number(value))}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#000", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                    formatter={(value: number) => formatINR(value)}
                    labelFormatter={(label) => `Year ${label}`}
                  />
                  <Area type="monotone" dataKey="conservative" stroke="#3b82f6" fill="url(#goalBlue)" strokeWidth={2} />
                  <Area type="monotone" dataKey="moderate" stroke="#10b981" fill="url(#goalEmerald)" strokeWidth={2} />
                  <Area type="monotone" dataKey="aggressive" stroke="#f59e0b" fill="url(#goalAmber)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {result.gapAnalysis && (
            <div
              className={`liquid-glass rounded-2xl p-6 border ${
                result.gapAnalysis.isOnTrack
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-amber-500/30 bg-amber-500/5"
              }`}
            >
              {result.gapAnalysis.isOnTrack ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <h3 className="font-heading italic text-2xl text-white">You&apos;re on track for {result.goal.name}</h3>
                  </div>
                  <p className="text-white/60 text-sm">
                    Current projected corpus: {formatINR(result.gapAnalysis.currentProjectedCorpus)} vs target corpus{" "}
                    {formatINR(result.gapAnalysis.targetCorpus)}.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-amber-400">
                    <TrendingDown className="w-5 h-5" />
                    <h3 className="font-heading italic text-2xl text-white">You need a little more SIP fuel for {result.goal.name}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <MiniStat label="Current Trajectory" value={formatINR(result.gapAnalysis.currentProjectedCorpus)} tone="text-white" />
                    <MiniStat label="Your Goal" value={formatINR(result.gapAnalysis.targetCorpus)} tone="text-white" />
                  </div>
                  <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-red-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, (Math.abs(result.gapAnalysis.gap) / Math.max(result.gapAnalysis.targetCorpus, 1)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-amber-400 font-heading italic text-2xl">
                    Increase monthly SIP by {formatINR(result.gapAnalysis.monthlyIncreaseNeeded)}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="liquid-glass rounded-2xl p-5 overflow-hidden">
              <h3 className="text-white font-heading italic text-xl mb-4">Allocation Plan</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-white/40 uppercase tracking-widest text-[10px]">
                      <th className="py-2 pr-3">Category</th>
                      <th className="py-2 pr-3">%</th>
                      <th className="py-2 pr-3">Monthly Rs</th>
                      <th className="py-2 pr-3">Risk</th>
                      <th className="py-2 pr-3">Tax Benefit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.allocationPlan.map((item) => (
                      <tr key={item.category} className="border-b border-white/5 last:border-0">
                        <td className="py-3 pr-3 text-white/90">{item.category}</td>
                        <td className="py-3 pr-3 text-white/70">{item.percentage}%</td>
                        <td className="py-3 pr-3 text-white/70">{formatINR(item.monthlyAmount)}</td>
                        <td className="py-3 pr-3">
                          <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase border ${getRiskBadgeTone(item.riskLevel)}`}>
                            {item.riskLevel}
                          </span>
                        </td>
                        <td className="py-3 pr-3">
                          {item.taxBenefit ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Minus className="w-4 h-4 text-white/20" />}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-white/10">
                      <td className="py-3 pr-3 text-white font-medium">Total</td>
                      <td className="py-3 pr-3 text-white font-medium">100%</td>
                      <td className="py-3 pr-3 text-white font-medium">{formatINR(result.goal.monthlyAmount)}</td>
                      <td className="py-3 pr-3 text-white/40">-</td>
                      <td className="py-3 pr-3 text-white/40">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3">
              <AdviceCard accent="emerald" title="Plan Summary" text={result.planSummary} />
              <AdviceCard accent="blue" title="Top Priority" text={result.topPriority} />
              <AdviceCard accent="yellow" title="Emergency Fund Advice" text={result.emergencyFundAdvice} />
              <AdviceCard accent="white" title="Tax Note" text={result.taxNote} />
              <AdviceCard accent="emerald" title="SIP Start Advice" text={result.sipStartAdvice} />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StressTest({ portfolioContext }: { portfolioContext: PortfolioContext | null }) {
  const [totalValue, setTotalValue] = useState<number>(0);
  const [allocation, setAllocation] = useState<AllocationState>(getDefaultAllocation());
  const [autoFilled, setAutoFilled] = useState(false);
  const [analysis, setAnalysis] = useState<{
    riskRating: "LOW" | "MEDIUM" | "HIGH";
    riskSummary: string;
    protectiveActions: string[];
    safeHavenAdvice: string;
    rebalanceSuggestion: string;
    overallRiskRating: "low" | "medium" | "high";
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);

  useEffect(() => {
    if (!portfolioContext) return;
    setTotalValue(portfolioContext.currentValue || 0);
    setAllocation(deriveAllocationFromPortfolio(portfolioContext));
    setAutoFilled(Boolean(portfolioContext.currentValue));
  }, [portfolioContext]);

  const sum = getSum(allocation);

  const scenarioResults = useMemo(
    () => CRASH_SCENARIOS.map((scenario) => calculateScenarioResult(scenario, allocation, totalValue)),
    [allocation, totalValue]
  );

  const worstScenario = useMemo(() => {
    if (scenarioResults.length === 0) return null;
    return scenarioResults.reduce((lowest, current) => (current.portfolioDrop < lowest.portfolioDrop ? current : lowest), scenarioResults[0]);
  }, [scenarioResults]);

  const overallRisk = useMemo(() => overallRiskFromWorstDrop(worstScenario?.portfolioDrop || 0), [worstScenario]);

  const adjustAllocation = (key: keyof AllocationState, value: number) => {
    setAllocation((prev) => normalizeAllocation({ ...prev, [key]: value }, key));
  };

  const autoFillFromXray = () => {
    const derived = deriveAllocationFromPortfolio(portfolioContext);
    setAllocation(derived);
    setTotalValue(portfolioContext?.currentValue || 0);
    setAutoFilled(Boolean(portfolioContext));
  };

  const runAIInsight = async () => {
    if (!worstScenario) return;
    setLoading(true);
    setError("");
    setAnalysis(null);
    try {
      const res = await fetch("/api/stress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allocation,
          totalValue,
          worstScenarioName: worstScenario.name,
          worstDrop: worstScenario.portfolioDrop,
        }),
      });
      const data = (await res.json().catch(() => null)) as typeof analysis;
      if (!res.ok || !data) throw new Error("Unable to generate analysis");
      setAnalysis(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to generate analysis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="liquid-glass rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-white/40 text-[10px] uppercase tracking-widest">Primary Flow</p>
            <h3 className="font-heading italic text-3xl text-white">Stress Test Your Allocation</h3>
            <p className="text-white/60 text-sm mt-1">
              Adjust your portfolio mix, then see how it would have behaved through four major Indian market crashes.
            </p>
          </div>
          {autoFilled && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 px-3 py-1 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
              <Sparkles className="w-3 h-3" />
              Auto-filled from X-Ray
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-3">
            <label className="block text-sm text-slate-300">Total portfolio value</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">₹</span>
              <input
                type="number"
                min={0}
                value={totalValue}
                onChange={(event) => setTotalValue(Math.max(0, Number(event.target.value) || 0))}
                className="w-full bg-black/50 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white outline-none focus:border-emerald-500/30"
                placeholder="Enter portfolio value"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="block text-sm text-slate-300">Allocation sum</label>
              {portfolioContext && (
                <button onClick={autoFillFromXray} className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">
                  Refill from X-Ray
                </button>
              )}
            </div>
            <div className={`text-sm font-semibold ${sum === 100 ? "text-emerald-400" : sum > 100 ? "text-red-400" : "text-yellow-400"}`}>
              {sum === 100 ? "✓ Perfect allocation" : sum > 100 ? `⚠ Over by ${sum - 100}%` : `${100 - sum}% unallocated`}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { key: "largeCap" as const, label: "Large Cap Equity" },
            { key: "midCap" as const, label: "Mid Cap Equity" },
            { key: "smallCap" as const, label: "Small Cap Equity" },
            { key: "debt" as const, label: "Debt / Liquid" },
            { key: "gold" as const, label: "Gold / Others" },
          ].map((item) => (
            <AllocationSlider
              key={item.key}
              label={item.label}
              value={allocation[item.key]}
              onChange={(value) => adjustAllocation(item.key, value)}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setAllocation(getDefaultAllocation())}
            className="liquid-glass rounded-full px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            Reset mix
          </button>
          <button
            onClick={autoFillFromXray}
            className="liquid-glass rounded-full px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            Use X-Ray mix
          </button>
          <button
            onClick={runAIInsight}
            disabled={loading || sum !== 100 || totalValue <= 0 || !worstScenario}
            title={sum !== 100 ? "Allocations must sum to 100%" : undefined}
            className="liquid-glass-strong rounded-full px-6 py-3 text-white font-body font-medium inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Run Stress Test
          </button>
        </div>
      </div>

      {scenarioResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarioResults.map((scenario) => (
            <ScenarioResultCard
              key={scenario.name}
              scenario={scenario}
              expanded={expandedScenario === scenario.name}
              onToggle={() => setExpandedScenario((prev) => (prev === scenario.name ? null : scenario.name))}
            />
          ))}
        </div>
      )}

      {worstScenario && (
        <div className={`liquid-glass rounded-2xl p-5 border ${overallRisk.tone}`}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-widest">Overall Risk</p>
              <h3 className="font-heading italic text-2xl text-white">Worst case risk profile</h3>
            </div>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest border ${overallRisk.tone}`}>
              {overallRisk.label}
            </span>
          </div>
          <p className="text-white/60 text-sm mt-3">
            Worst scenario: {worstScenario.name} with a {worstScenario.portfolioDrop.toFixed(1)}% drop and estimated loss of {formatINR(worstScenario.portfolioLoss)}.
          </p>
        </div>
      )}

      {error && (
        <div className="liquid-glass rounded-xl p-4 border border-red-500/30 text-red-400 text-sm flex gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {analysis && (
        <div className="liquid-glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-widest">AI Risk Analysis</p>
              <h3 className="font-heading italic text-2xl text-white">{analysis.riskRating} Risk</h3>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest border ${
                analysis.riskRating === "HIGH"
                  ? "bg-red-500/20 text-red-400 border-red-500/20"
                  : analysis.riskRating === "MEDIUM"
                    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/20"
                    : "bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
              }`}
            >
              {analysis.riskRating}
            </span>
          </div>
          <p className="text-white/70 text-sm leading-relaxed">{analysis.riskSummary}</p>
          <div className="space-y-2">
            {analysis.protectiveActions.map((action) => (
              <div key={action} className="liquid-glass rounded-xl px-4 py-3 text-sm text-white/70">
                → {action}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AdviceCard accent="emerald" title="Safe Haven Advice" text={analysis.safeHavenAdvice} />
            <AdviceCard accent="blue" title="Rebalance Suggestion" text={analysis.rebalanceSuggestion} />
          </div>
        </div>
      )}

      <CrashScenariosSection />
    </div>
  );
}

function AllocationSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm text-white/80">{label}</label>
        <span className="text-white/50 text-sm font-medium">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-emerald-400"
      />
    </div>
  );
}

function ScenarioResultCard({
  scenario,
  expanded,
  onToggle,
}: {
  scenario: ScenarioResult;
  expanded: boolean;
  onToggle: () => void;
}) {
  const scenarioBg = scenarioBadgeColor(scenario.portfolioDrop);
  const phaseWidth = Math.max(18, Math.round((scenario.crashMonths / (scenario.crashMonths + scenario.estimatedRecoveryMonths + 1)) * 100));
  const recoveryWidth = 100 - phaseWidth;

  return (
    <div className="liquid-glass rounded-2xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-heading italic text-xl text-white">{scenario.name}</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="liquid-glass rounded-full px-3 py-1 text-[10px] text-white/50">{scenario.period}</span>
            <span className="rounded-full px-3 py-1 text-[10px] border border-red-500/20 bg-red-500/10 text-red-400">Nifty: {scenario.niftyDrop}%</span>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-widest border ${scenarioBg}`}>{scenario.portfolioDrop.toFixed(1)}% drop</span>
      </div>

      <p className={`${scenarioRiskColor(scenario.portfolioDrop)} font-heading italic text-4xl`}>{scenario.portfolioDrop.toFixed(1)}% drop</p>
      <p className="text-white/60 text-sm">You would have lost {formatINR(scenario.portfolioLoss)}.</p>
      <p className="text-white/50 text-xs">Est. recovery: ~{scenario.estimatedRecoveryMonths} months</p>

      <div className="space-y-2">
        <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden border border-white/10 flex">
          <div className="bg-red-500/70" style={{ width: `${phaseWidth}%` }} />
          <div className="bg-emerald-500/70" style={{ width: `${recoveryWidth}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-white/40">
          <span>Crash: {scenario.crashMonths} months</span>
          <span>Recovery: {scenario.estimatedRecoveryMonths} months</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {ALLOCATION_KEYS.map((key) => {
          const value = scenario.drops[key];
          return (
            <div key={key} className="bg-white/5 rounded-lg p-2 text-center">
              <p className="text-white/40 text-[10px]">{formatAssetName(key)}</p>
              <p className={`text-sm font-medium ${value >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {value >= 0 ? "+" : ""}
                {value}%
              </p>
            </div>
          );
        })}
      </div>

      <div className="space-y-1 pt-2 border-t border-white/10">
        <p className="text-emerald-400 text-xs">✓ Smart investors: {scenario.whatSmartInvestorsDid}</p>
        <p className="text-red-400/70 text-xs">✗ Panic mistake: {scenario.whatPanickedInvestorsDid}</p>
      </div>

      <button onClick={onToggle} className="text-xs text-white/50 hover:text-white transition-colors inline-flex items-center gap-1">
        {expanded ? "Hide lesson" : "Show lesson"}
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {expanded && <div className="liquid-glass rounded-full px-3 py-2 text-xs text-white/50">Key lesson: {scenario.lesson}</div>}
    </div>
  );
}

function AdviceCard({
  accent,
  title,
  text,
}: {
  accent: "emerald" | "blue" | "yellow" | "white";
  title: string;
  text: string;
}) {
  const accentClasses = {
    emerald: "border-emerald-500/20 text-emerald-400",
    blue: "border-blue-500/20 text-blue-400",
    yellow: "border-yellow-500/20 text-yellow-400",
    white: "border-white/10 text-white/60",
  } as const;

  return (
    <div className={`liquid-glass rounded-xl p-4 border ${accentClasses[accent]}`}>
      <p className={`text-[10px] uppercase tracking-widest mb-2 ${accentClasses[accent]}`}>{title}</p>
      <p className="text-white/70 text-sm leading-relaxed">{text}</p>
    </div>
  );
}

function MetricCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 border ${highlight ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/5 border-white/10"}`}>
      <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-xl font-heading italic ${highlight ? "text-emerald-400" : "text-white"}`}>{value}</p>
    </div>
  );
}

function ScenarioCard({
  title,
  rate,
  projection,
  borderClass,
  accentClass,
  badge,
  highlight = false,
}: {
  title: string;
  rate: string;
  projection: { totalCorpus: number; totalInvested: number; wealthGained: number };
  borderClass: string;
  accentClass: string;
  badge?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`liquid-glass rounded-2xl p-5 border ${borderClass} ${highlight ? "bg-emerald-500/5" : ""}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-white/40 text-[10px] uppercase tracking-widest">{rate}</p>
          <h4 className={`font-heading italic text-2xl text-white ${accentClass}`}>{title}</h4>
        </div>
        {badge && (
          <span className="liquid-glass rounded-full px-3 py-1 text-[10px] text-white/50 uppercase tracking-widest">
            {badge}
          </span>
        )}
      </div>
      <p className="font-heading italic text-3xl text-white">{formatINR(projection.totalCorpus)}</p>
      <p className="text-white/50 text-sm mt-1">Invested: {formatINR(projection.totalInvested)}</p>
      <p className="text-emerald-400 text-sm mt-1">Gained: {formatINR(projection.wealthGained)}</p>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="bg-white/5 rounded-xl px-4 py-3">
      <p className="text-white/40 text-[10px] uppercase tracking-widest">{label}</p>
      <p className={`text-lg font-body font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function CrashScenariosSection() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="liquid-glass rounded-full px-3 py-1 text-[10px] uppercase tracking-widest text-white/50">Market History</span>
        <h3 className="font-heading italic text-3xl text-white">What actually happened in each crash</h3>
      </div>
      <p className="text-white/60 text-sm">The investors who stayed invested came out ahead every time.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CRASH_SCENARIOS.map((scenario) => {
          const estimatedRecoveryMonths = Math.round(
            (scenario.recoveryMonths.largeCap +
              scenario.recoveryMonths.midCap +
              scenario.recoveryMonths.smallCap +
              scenario.recoveryMonths.debt +
              scenario.recoveryMonths.gold) /
              5
          );
          const totalDuration = scenario.crashMonths + estimatedRecoveryMonths;
          const crashWidth = Math.max(18, Math.round((scenario.crashMonths / totalDuration) * 100));
          const recoveryWidth = 100 - crashWidth;

          return (
            <div key={scenario.name} className="liquid-glass rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h4 className="font-heading italic text-xl text-white">{scenario.name}</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="liquid-glass rounded-full px-3 py-1 text-[10px] text-white/50">{scenario.period}</span>
                    <span className="rounded-full px-3 py-1 text-[10px] border border-red-500/20 bg-red-500/10 text-red-400">Nifty: {scenario.niftyDrop}%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden border border-white/10 flex">
                  <div className="bg-red-500/70" style={{ width: `${crashWidth}%` }} />
                  <div className="bg-emerald-500/70" style={{ width: `${recoveryWidth}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-white/40">
                  <span>Crash: {scenario.crashMonths} months</span>
                  <span>Recovery: {estimatedRecoveryMonths} months</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {ALLOCATION_KEYS.map((key) => {
                  const value = scenario.drops[key];
                  return (
                    <div key={key} className="bg-white/5 rounded-lg p-2 text-center">
                      <p className="text-white/40 text-[10px]">{formatAssetName(key)}</p>
                      <p className={`text-sm font-medium ${value >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {value >= 0 ? "+" : ""}
                        {value}%
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1 pt-2 border-t border-white/10">
                <p className="text-emerald-400 text-xs">✓ Smart investors: {scenario.whatSmartInvestorsDid}</p>
                <p className="text-red-400/70 text-xs">✗ Panic mistake: {scenario.whatPanickedInvestorsDid}</p>
              </div>

              <div className="liquid-glass rounded-full px-3 py-2 text-xs text-white/50">Key lesson: {scenario.lesson}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
