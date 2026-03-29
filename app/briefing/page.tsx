"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import ExportPdfButton from "@/components/ExportPdfButton";
import MarketMoodIndicator from "@/components/MarketMoodIndicator";
import { ArrowRight, BarChart3, BrainCircuit, Clock3, ExternalLink, LineChart, Radar, ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";
import { STORAGE_KEYS } from "@/lib/storage";

interface BriefingAlert {
  id: string;
  severity: "high" | "medium" | "low";
  category: "portfolio" | "market" | "opportunity" | "action";
  title: string;
  detail: string;
  action: string;
  linkedFeature: "/xray" | "/radar" | "/charts" | "/chat";
  linkedLabel: string;
}

interface Briefing {
  generatedAt: string;
  investorName: string;
  marketMood: string;
  moodEmoji?: string;
  headline: string;
  alerts: BriefingAlert[];
  topOpportunity: string;
  urgentAction: string;
}

const categoryMeta: Record<BriefingAlert["category"], { label: string; icon: ReactNode }> = {
  portfolio: { label: "Portfolio", icon: <BarChart3 className="w-4 h-4" /> },
  market: { label: "Market", icon: <LineChart className="w-4 h-4" /> },
  opportunity: { label: "Opportunity", icon: <Sparkles className="w-4 h-4" /> },
  action: { label: "Action", icon: <BrainCircuit className="w-4 h-4" /> },
};

const featureIcons = {
  "/xray": <ShieldCheck className="w-4 h-4" />,
  "/radar": <Radar className="w-4 h-4" />,
  "/charts": <LineChart className="w-4 h-4" />,
  "/chat": <ExternalLink className="w-4 h-4" />,
} as const;

export default function BriefingPage() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasPortfolio, setHasPortfolio] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.xrayResult) || localStorage.getItem(STORAGE_KEYS.legacyXrayResult);
    setHasPortfolio(!!stored);
  }, []);

  async function generateBriefing() {
    setLoading(true);
    setError("");

    try {
      const portfolioContext = localStorage.getItem(STORAGE_KEYS.xrayResult) || localStorage.getItem(STORAGE_KEYS.legacyXrayResult);
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolioContext: portfolioContext ? JSON.parse(portfolioContext) : null,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to generate briefing");
      setBriefing(data);
    } catch {
      setError("Unable to generate the briefing right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const severityColor = {
    high: "border-red-500/50 bg-red-500/5",
    medium: "border-yellow-500/50 bg-yellow-500/5",
    low: "border-emerald-500/50 bg-emerald-500/5",
  };

  const severityDot = {
    high: "bg-red-400",
    medium: "bg-yellow-400",
    low: "bg-emerald-400",
  };

  const moodTone = briefing?.marketMood?.toLowerCase().includes("risk")
    ? "text-red-300"
    : briefing?.marketMood?.toLowerCase().includes("bull")
      ? "text-emerald-300"
      : "text-white";

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-4xl mx-auto">
      <PageHeader
        title="My Briefing"
        description="A concise daily briefing connecting your portfolio, market signals, and next best actions."
        action={<ExportPdfButton />}
      />

      <div className="print-header print-only">
        ET InvestIQ Briefing Report
      </div>

      <div className="max-w-xl">
        <MarketMoodIndicator compact />
      </div>

      {!briefing && !loading && (
        <div className="liquid-glass rounded-2xl p-8 text-center border border-white/10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
            <Clock3 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-medium text-white mb-2">
            {hasPortfolio
              ? "Ready to generate your personalised briefing"
              : "Generate a market briefing"}
          </h2>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
            {hasPortfolio
              ? "ET InvestIQ will cross-reference your portfolio holdings with today’s market context and surface the most relevant actions."
              : "Run Portfolio X-Ray first for a personalised briefing, or generate a general market briefing now."}
          </p>
          {!hasPortfolio && (
            <a
              href="/xray"
              className="inline-flex items-center gap-2 mb-4 text-emerald-400 text-sm border border-emerald-500/30 px-4 py-2 rounded-lg hover:bg-emerald-500/10 transition-colors mr-3"
            >
              Run X-Ray first <ArrowRight className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={generateBriefing}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-medium px-8 py-3 rounded-xl transition-colors"
          >
            Generate Briefing
          </button>
        </div>
      )}

      {loading && (
        <div className="liquid-glass rounded-2xl p-12 text-center border border-white/10">
          <div className="flex flex-col items-center gap-4">
            {[
              "Retrieving market context...",
              "Reviewing your portfolio holdings...",
              "Cross-referencing live signals...",
              "Preparing the briefing...",
            ].map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.8 }}
                className="flex items-center gap-3 text-slate-400 text-sm"
              >
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1,
                    delay: i * 0.8,
                  }}
                  className="w-2 h-2 rounded-full bg-emerald-400"
                />
                {step}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="liquid-glass rounded-xl p-4 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {briefing && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 print-section"
          >
            <div className="liquid-glass rounded-2xl p-6 border border-white/10">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-slate-400 text-xs mb-1">
                    {new Date(briefing.generatedAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  <h2 className="font-heading italic text-2xl text-white">
                    {briefing.headline}
                  </h2>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${moodTone} border-white/10 bg-white/5`}>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{briefing.marketMood}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-slate-400 text-xs uppercase tracking-widest">
                Your Alerts - {briefing.alerts.length} items
              </h3>
              {briefing.alerts.map((alert, i) => {
                const meta = categoryMeta[alert.category];
                const featureIcon = featureIcons[alert.linkedFeature];
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`liquid-glass rounded-xl p-5 border ${severityColor[alert.severity]}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80">
                        {meta.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${severityDot[alert.severity]}`} />
                          <span className="text-white font-medium text-sm">{alert.title}</span>
                          <span className="text-slate-500 text-xs capitalize">{alert.severity} priority</span>
                          <span className="text-slate-500 text-xs uppercase tracking-widest">{meta.label}</span>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed mb-3">
                          {alert.detail}
                        </p>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-emerald-400 text-xs flex items-center gap-1.5">
                            {featureIcon} {alert.action}
                          </p>
                          <a
                            href={alert.linkedFeature}
                            className="text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1 rounded-lg transition-colors inline-flex items-center gap-1.5"
                          >
                            {alert.linkedLabel} <ArrowRight className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="liquid-glass rounded-xl p-4 border border-white/10">
                <p className="text-slate-400 text-xs mb-1">Top opportunity</p>
                <p className="text-white text-sm">{briefing.topOpportunity}</p>
              </div>
              <div className="liquid-glass rounded-xl p-4 border border-emerald-500/20">
                <p className="text-emerald-400 text-xs mb-1">Urgent action</p>
                <p className="text-white text-sm">{briefing.urgentAction}</p>
              </div>
            </div>

            <button
              onClick={generateBriefing}
              className="w-full text-slate-400 text-sm border border-white/10 py-3 rounded-xl hover:bg-white/5 transition-colors"
            >
              Regenerate briefing
            </button>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
