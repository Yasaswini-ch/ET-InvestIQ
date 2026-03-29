"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
  ArrowRight,
  AlertTriangle,
  Info,
  TrendingUp,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import MetricCard from "@/components/MetricCard";
import HealthScoreRing from "@/components/HealthScoreRing";
import AllocationPieChart from "@/components/AllocationPieChart";
import FundXIRRBarChart from "@/components/FundXIRRBarChart";
import OverlapHeatmap from "@/components/OverlapHeatmap";
import RebalancingPlan from "@/components/RebalancingPlan";
import FundDetailsTable from "@/components/FundDetailsTable";
import { formatCompactINR, formatINR } from "@/lib/utils";
import ShareCard from "@/components/ShareCard";
import ExportPdfButton from "@/components/ExportPdfButton";
import { STORAGE_KEYS } from "@/lib/storage";

export default function XRayPage() {
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealStep, setRevealStep] = useState(0);

  const handleFileChange = async (file: File | null, useSample: boolean) => {
    if (!file && !useSample) return;

    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    setRevealStep(0);

    const formData = new FormData();
    if (file) formData.append("pdf", file);
    if (useSample) formData.append("useSample", "true");

    try {
      const res = await fetch("/api/xray", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Analysis failed");
      }

      const data = await res.json();
      setAnalysis(data);
      try {
        const portfolioContext = {
          investorName: data.investorName,
          riskProfile: data.riskProfile,
          currentValue: data.currentValue,
          overallXIRR: data.overallXIRR,
          portfolioHealthScore: data.portfolioHealthScore,
          topFunds: Array.isArray(data.funds)
            ? data.funds.slice(0, 5).map((f: any) => ({
                name: f.name,
                category: f.category,
                currentValue: f.currentValue,
                xirr: f.xirr,
              }))
            : [],
          topInsights: Array.isArray(data.insights) ? data.insights.slice(0, 3).map((i: any) => i.title) : [],
          rebalancingSummary: data.rebalancingPlan?.summary,
        };
        localStorage.setItem(STORAGE_KEYS.portfolioContext, JSON.stringify(portfolioContext));
        localStorage.setItem(STORAGE_KEYS.xrayResult, JSON.stringify(data));
        localStorage.setItem(STORAGE_KEYS.legacyXrayResult, JSON.stringify(data));
      } catch {
        // Ignore local storage failures.
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!analysis) return;
    setRevealStep(1);
    const timers = [
      setTimeout(() => setRevealStep(2), 500),
      setTimeout(() => setRevealStep(3), 1000),
      setTimeout(() => setRevealStep(4), 1500),
    ];
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [analysis]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Portfolio X-Ray"
        description="Upload your CAS statement (CAMS/KFintech) to get a comprehensive AI-driven analysis of your mutual fund portfolio."
        action={<ExportPdfButton />}
      />

      <div className="print-header print-only">ET InvestIQ Portfolio X-Ray Report</div>

      <AnimatePresence mode="wait">
        {!analysis && !isLoading && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}>
            <UploadZone onFileChange={handleFileChange} isLoading={isLoading} />
          </motion.div>
        )}

        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 liquid-glass rounded-2xl"
          >
            <div className="relative w-16 h-16 mb-8">
              <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Analyzing Portfolio</h3>
            <p className="text-white/60 text-sm mb-6">Extracting holdings and running AI risk models...</p>
            <div className="space-y-2 text-xs text-white/60 text-center">
              <p>1. Reading CAS statement and extracting folios</p>
              <p>2. Estimating overlap, fees, and portfolio health</p>
              <p>3. Building an AI rebalancing plan</p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-5 liquid-glass rounded-xl flex items-center gap-4 text-red-400"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-sm">Analysis Failed</p>
              <p className="text-xs text-red-400/80">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="px-4 py-2 bg-red-500/20 border border-red-400/20 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/30 transition-all">
              Try Again
            </button>
          </motion.div>
        )}

        {analysis && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 print-section">
            <div className="flex items-center justify-between gap-4 p-5 liquid-glass rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-400/20 rounded-xl flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{analysis.investorName}&apos;s Portfolio</h3>
                  <p className="text-xs text-white/60">PortfolioXRay - Last updated: {analysis.statementDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Health Score</p>
                  <p className="text-xl font-bold text-white">{analysis.portfolioHealthScore}/100</p>
                </div>
                <button
                  onClick={() => setAnalysis(null)}
                  className="flex items-center gap-2 px-4 py-2 liquid-glass rounded-lg text-sm font-bold text-white/80 hover:text-white transition-all"
                >
                  <RefreshCcw className="w-4 h-4" />
                  New Analysis
                </button>
              </div>
            </div>

            <Results analysis={analysis} revealStep={revealStep} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UploadZone({
  onFileChange,
  isLoading,
}: {
  onFileChange: (file: File | null, useSample: boolean) => void;
  isLoading: boolean;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div
        className={`relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl transition-all duration-200 min-h-[360px] ${
          isDragOver
            ? "border-emerald-400/50 bg-emerald-500/5 scale-[1.01]"
            : "liquid-glass border-white/10 hover:border-white/20"
        }`}
        onDragEnter={() => setIsDragOver(true)}
        onDragLeave={() => setIsDragOver(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file?.type === "application/pdf") onFileChange(file, false);
        }}
      >
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-400/20 rounded-full flex items-center justify-center text-emerald-400 mb-5">
          <Upload className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Drop your CAS PDF here</h3>
        <p className="text-white/60 text-center text-sm mb-7 max-w-xs leading-relaxed">
          Your statement remains private. We only extract data for analysis and do not store your files.
        </p>

        <input
          type="file"
          className="hidden"
          id="pdf-upload"
          accept=".pdf"
          onChange={(e) => onFileChange(e.target.files ? e.target.files[0] : null, false)}
        />
        <label
          htmlFor="pdf-upload"
          className="cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-xl transition-all text-sm"
        >
          Select CAS File
        </label>
      </div>

      <div className="liquid-glass rounded-2xl p-10 flex flex-col justify-center">
        <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-400/20 rounded-xl flex items-center justify-center text-emerald-400 mb-5">
          <FileText className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-bold text-white mb-3">No statement handy?</h3>
        <p className="text-white/60 mb-7 leading-relaxed text-sm">
          Use our pre-loaded sample portfolio to explore all features including fund overlap, XIRR analysis, and AI
          rebalancing plans.
        </p>
        <button
          onClick={() => onFileChange(null, true)}
          className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-7 rounded-xl transition-all group disabled:opacity-50 text-sm"
          disabled={isLoading}
        >
          Try Sample Portfolio <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}

interface Insight {
  type: "warning" | "success" | "info";
  title: string;
  description: string;
}

const insightStyles = {
  warning: {
    wrapper: "bg-yellow-500/10 border-yellow-400/20",
    icon: "bg-yellow-500/10 border-yellow-400/20 text-yellow-400",
    title: "text-yellow-400",
    desc: "text-white/60",
    Icon: AlertTriangle,
  },
  success: {
    wrapper: "bg-emerald-500/10 border-emerald-400/20",
    icon: "bg-emerald-500/10 border-emerald-400/20 text-emerald-400",
    title: "text-emerald-400",
    desc: "text-white/60",
    Icon: TrendingUp,
  },
  info: {
    wrapper: "bg-blue-500/10 border-blue-400/20",
    icon: "bg-blue-500/10 border-blue-400/20 text-blue-400",
    title: "text-blue-400",
    desc: "text-white/60",
    Icon: Info,
  },
};

function InsightsSection({ insights }: { insights: Insight[] }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-4">AI Insights</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {insights.map((insight, i) => {
          const s = insightStyles[insight.type] ?? insightStyles.info;
          const { Icon } = s;
          return (
            <div key={i} className={`p-5 rounded-xl border flex gap-4 ${s.wrapper}`}>
              <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center border ${s.icon}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className={`text-xs font-bold mb-1 ${s.title}`}>{insight.title}</p>
                <p className={`text-xs leading-relaxed ${s.desc}`}>{insight.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getVerdict(analysis: any) {
  const score = analysis.portfolioHealthScore ?? 0;
  if (score >= 75) {
    return `Your portfolio is healthy but bleeding ${formatINR(
      analysis.expenseDragAnnual ?? 0
    )}/year in avoidable fees.`;
  }
  if (score >= 55) {
    return `Your portfolio is stable but needs focused optimization to stop fee and overlap drag.`;
  }
  return `Your portfolio needs urgent cleanup to control risk and improve long-term compounding.`;
}

function Results({ analysis, revealStep }: { analysis: any; revealStep: number }) {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="liquid-glass rounded-2xl p-5"
      >
        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">Portfolio Verdict</p>
        <h2 className="text-2xl font-bold text-white leading-tight">{getVerdict(analysis)}</h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: revealStep >= 1 ? 1 : 0, y: revealStep >= 1 ? 0 : 10 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetricCard label="Current" value={analysis.currentValue} formatter={formatCompactINR} />
          <MetricCard label="XIRR" value={analysis.overallXIRR} formatter={(value) => `${value.toFixed(1)}%`} />
          <MetricCard label="Exp/yr" value={analysis.expenseDragAnnual} formatter={(value) => formatINR(Math.round(value))} />
          <MetricCard label="Health" value={analysis.portfolioHealthScore} formatter={(value) => `${Math.round(value)}/100`} />
        </div>
        <div className="liquid-glass rounded-2xl p-7 flex flex-col items-center justify-center">
          <HealthScoreRing score={analysis.portfolioHealthScore} />
          <p className="mt-4 text-xs font-bold text-white/60 uppercase tracking-widest">Portfolio Health</p>
          <div className="mt-6 w-full">
            <ShareCard investorName={analysis.investorName} healthScore={analysis.portfolioHealthScore} xirr={analysis.overallXIRR} currentValue={analysis.currentValue} alpha={analysis.benchmarkComparison?.alpha || 0} />
          </div>
          <p className="mt-1 text-xs text-white/60">
            {analysis.riskProfile} risk profile - Alpha {analysis.benchmarkComparison?.alpha?.toFixed?.(1) ?? analysis.benchmarkComparison?.alpha}%
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: revealStep >= 2 ? 1 : 0, y: revealStep >= 2 ? 0 : 10 }}
        className="grid grid-cols-1 xl:grid-cols-2 gap-6"
      >
        <AllocationPieChart data={analysis.funds} />
        <FundXIRRBarChart data={analysis.funds} />
      </motion.div>

      {analysis.insights && analysis.insights.length > 0 && <InsightsSection insights={analysis.insights} />}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: revealStep >= 3 ? 1 : 0 }}>
        <OverlapHeatmap data={analysis.overlapMatrix} reveal={revealStep >= 3} />
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: revealStep >= 4 ? 1 : 0 }}>
        <RebalancingPlan data={analysis.rebalancingPlan} typewriter={revealStep >= 4} />
      </motion.div>
      <FundDetailsTable funds={analysis.funds} />
    </div>
  );
}
