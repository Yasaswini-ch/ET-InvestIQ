"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import html2canvas from "html2canvas";
import { motion } from "framer-motion";
import {
  Shield,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Scale,
  Download,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ScoreRing from "@/components/ScamShield/ScoreRing";
import RedFlagList from "@/components/ScamShield/RedFlagList";
import VolumeAnomalyCard from "@/components/ScamShield/VolumeAnomalyCard";
import TickerMentionBadge from "@/components/ScamShield/TickerMentionBadge";
import SampleMessages from "@/components/ScamShield/SampleMessages";
import { ScamCheckResult } from "@/lib/types/scamcheck";
import { staggerContainer, staggerItem } from "@/lib/motion";

interface BulkScamResult {
  message: string;
  score: number;
  topFlag: string;
  flags: string[];
  verdict: string;
}

function VerdictBadge({ verdict }: { verdict: string }) {
  if (verdict === "LIKELY SCAM") {
    return <span className="bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-4 py-1.5 text-sm font-body font-medium">{verdict}</span>;
  }
  if (verdict === "SUSPICIOUS") {
    return <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full px-4 py-1.5 text-sm font-body font-medium">{verdict}</span>;
  }
  if (verdict === "PROBABLY SAFE") {
    return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full px-4 py-1.5 text-sm font-body font-medium">{verdict}</span>;
  }
  return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-4 py-1.5 text-sm font-body font-medium">{verdict}</span>;
}

function BoolFlagRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="liquid-glass rounded-xl px-4 py-3 flex items-center justify-between">
      <span className="text-white/70 text-xs font-body">{label}</span>
      {value ? <XCircle className="w-4 h-4 text-red-400" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
    </div>
  );
}

function riskTone(score: number) {
  if (score > 70) return "bg-red-500/15 border-red-500/30 text-red-300";
  if (score > 40) return "bg-amber-500/15 border-amber-500/30 text-amber-200";
  return "bg-emerald-500/15 border-emerald-500/30 text-emerald-200";
}

export default function ScamCheckPage() {
  const [sharedContext, setSharedContext] = useState<{ score: string | null; verdict: string | null }>({
    score: null,
    verdict: null,
  });
  const [tab, setTab] = useState<"single" | "bulk">("single");
  const [message, setMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ScamCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);
  const [bulkInput, setBulkInput] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkScamResult[]>([]);
  const [expandedBulk, setExpandedBulk] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const shareCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSharedContext({
      score: params.get("score"),
      verdict: params.get("verdict"),
    });
  }, []);

  function handleMessageChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setMessage(e.target.value);
    setCharCount(e.target.value.length);
  }

  function handleSampleSelect(sample: string) {
    setMessage(sample);
    setCharCount(sample.length);
    setResult(null);
    setError(null);
  }

  async function handleAnalyze() {
    if (!message.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/scamcheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) {
        const errData = (await response.json()) as { error?: string };
        throw new Error(errData.error ?? "Analysis failed");
      }
      const data = (await response.json()) as ScamCheckResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleBulkAnalyze() {
    const messages = bulkInput.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).slice(0, 10);
    if (!messages.length) return;

    setBulkLoading(true);
    setBulkResults([]);
    try {
      const response = await fetch("/api/scamcheck/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      const payload = (await response.json().catch(() => null)) as { results?: BulkScamResult[] } | null;
      setBulkResults(payload?.results ?? []);
    } finally {
      setBulkLoading(false);
    }
  }

  async function downloadShareCard() {
    if (!shareCardRef.current || !result) return;
    const canvas = await html2canvas(shareCardRef.current, { backgroundColor: "#050816", scale: 2 });
    const link = document.createElement("a");
    link.download = "scam-shield-result.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function copyShareLink() {
    if (!result) return;
    const url = new URL(window.location.href);
    url.searchParams.set("score", String(result.analysis.scamProbability));
    url.searchParams.set("verdict", result.analysis.verdict.replace(/\s+/g, "_"));
    await navigator.clipboard.writeText(url.toString());
    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 1600);
  }

  const analysis = result?.analysis;
  const bulkSummary = useMemo(() => {
    const highRisk = bulkResults.filter((item) => item.score > 70).length;
    const safe = bulkResults.filter((item) => item.score <= 40).length;
    return { total: bulkResults.length, highRisk, safe };
  }, [bulkResults]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Scam Shield"
        description="Paste suspicious tips one by one or in bulk. ET InvestIQ will score the risk and explain the red flags."
        action={<Shield className="w-8 h-8 text-emerald-400" />}
      />

      {(sharedContext.score || sharedContext.verdict) && (
        <div className="liquid-glass rounded-2xl border border-amber-400/20 p-4 text-sm text-white/75">
          Shared result context loaded: score {sharedContext.score ?? "-"} · verdict {(sharedContext.verdict ?? "").replaceAll("_", " ")}
        </div>
      )}

      <div className="inline-flex rounded-2xl border border-white/10 bg-black/30 p-1">
        {[
          { key: "single", label: "Single Check" },
          { key: "bulk", label: "Bulk Check" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key as "single" | "bulk")}
            className={`rounded-xl px-4 py-2 text-sm ${tab === item.key ? "bg-emerald-500 text-black" : "text-white/65 hover:text-white"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "single" ? (
        <>
          <div className="liquid-glass rounded-2xl p-6 max-w-3xl mx-auto border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/70 text-sm font-body font-medium">Paste the suspicious message</span>
              <span className="bg-white/10 text-white/50 text-xs rounded-full px-2.5 py-1 font-body">{charCount} chars</span>
            </div>

            <textarea
              rows={8}
              value={message}
              onChange={handleMessageChange}
              placeholder="Paste a WhatsApp forward, Telegram message, SMS, or any investment tip here..."
              className="bg-transparent text-white/90 font-body font-light text-sm w-full resize-none outline-none placeholder:text-white/30 leading-relaxed"
            />

            <SampleMessages onSelect={handleSampleSelect} />

            <div className="mt-5 flex justify-end">
              <button onClick={handleAnalyze} disabled={isAnalyzing || !message.trim()} className="liquid-glass-strong rounded-full px-8 py-3 font-body font-medium text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition hover:bg-white/10">
                {isAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin" />Analysing...</> : <><Shield className="w-4 h-4" />Analyse for Scams</>}
              </button>
            </div>

            {error && <p className="mt-3 text-red-400 text-sm font-body text-center">{error}</p>}
          </div>

          {result && analysis && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-10 max-w-6xl mx-auto space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  <div className="liquid-glass rounded-2xl p-6 flex flex-col items-center border border-white/10">
                    <ScoreRing score={analysis.scamProbability} />
                    <div className="mt-4"><VerdictBadge verdict={analysis.verdict} /></div>
                    <p className="text-white/60 text-sm font-body font-light text-center mt-3 leading-relaxed">{analysis.verdictReason}</p>
                    <div className="mt-4 flex flex-col gap-2 w-full">
                      <BoolFlagRow label="Guaranteed Returns" value={analysis.guaranteedReturnsFound} />
                      <BoolFlagRow label="Urgency Tactics" value={analysis.urgencyTacticsFound} />
                      <BoolFlagRow label="Unregistered Advisor" value={analysis.isUnregisteredAdvisor} />
                    </div>
                    <div className="mt-5 flex w-full gap-2">
                      <button onClick={() => void downloadShareCard()} className="flex-1 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-white/80 hover:bg-white/5 inline-flex items-center justify-center gap-2">
                        <Download className="w-4 h-4" />
                        Share Result
                      </button>
                      <button onClick={() => void copyShareLink()} className="flex-1 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-white/80 hover:bg-white/5 inline-flex items-center justify-center gap-2">
                        <Copy className="w-4 h-4" />
                        {copyState === "copied" ? "Copied" : "Copy Link"}
                      </button>
                    </div>
                  </div>

                  <VolumeAnomalyCard volumeCheck={result.volumeCheck} />
                </div>

                <div className="lg:col-span-2 flex flex-col gap-4">
                  {analysis.mentionedTicker && <TickerMentionBadge ticker={analysis.mentionedTicker} />}
                  <RedFlagList flags={analysis.redFlags} />

                  {analysis.extractedClaims.length > 0 && (
                    <div className="liquid-glass rounded-2xl p-5 border border-white/10">
                      <div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4 text-yellow-400" /><span className="text-white font-body font-medium text-sm">Exaggerated Claims Found</span></div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.extractedClaims.map((claim, i) => <span key={i} className="bg-yellow-500/10 text-yellow-300 text-xs rounded-full px-3 py-1 font-body">{claim}</span>)}
                      </div>
                    </div>
                  )}

                  {analysis.sebiViolations.length > 0 && (
                    <div className="liquid-glass rounded-2xl p-5 border border-white/10">
                      <div className="flex items-center gap-2 mb-3"><Scale className="w-4 h-4 text-red-400" /><span className="text-white font-body font-medium text-sm">Potential SEBI Violations</span></div>
                      <ul className="flex flex-col gap-2">
                        {analysis.sebiViolations.map((violation, i) => (
                          <li key={i} className="flex items-start gap-2 text-white/70 text-sm font-body font-light"><span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />{violation}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="liquid-glass rounded-2xl p-5 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-3"><ShieldCheck className="w-4 h-4 text-emerald-400" /><span className="text-white font-body font-medium text-sm">What to do instead</span></div>
                    <p className="text-white/70 text-sm font-body font-light leading-relaxed">{analysis.safeAlternative}</p>
                  </div>
                </div>
              </div>

              <p className="text-white/30 text-xs font-body text-center mt-8 leading-relaxed">This analysis is AI-generated and for educational purposes only. Always verify with SEBI&apos;s official investor portal at investor.sebi.gov.in before making any investment decisions.</p>
            </motion.div>
          )}

          <div className="fixed -left-[9999px] top-0">
            <div ref={shareCardRef} className="w-[420px] rounded-[24px] border border-white/10 bg-[#050816] p-8 text-white">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/60">ET InvestIQ</p>
                <p className={`rounded-full border px-3 py-1 text-xs ${riskTone(result?.analysis.scamProbability ?? 0)}`}>Scam Shield</p>
              </div>
              <div className="mt-8 text-center">
                <p className={`text-6xl font-semibold ${result && result.analysis.scamProbability > 70 ? "text-red-300" : result && result.analysis.scamProbability > 40 ? "text-amber-200" : "text-emerald-200"}`}>{result?.analysis.scamProbability ?? 0}</p>
                <p className="mt-2 text-lg">{result?.analysis.verdict ?? "SCAM CHECK"}</p>
                <p className="mt-4 text-sm text-white/70">{result?.analysis.verdictReason ?? "Shareable scam risk snapshot."}</p>
                <p className="mt-3 text-sm text-white/55">{result?.analysis.redFlags[0]?.flag ?? "No major flag"}</p>
              </div>
              <div className="mt-10 border-t border-white/10 pt-4 text-xs text-white/45">Checked on ET InvestIQ - scamcheck.etinvestiq.com</div>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-5 max-w-5xl">
          <div className="liquid-glass rounded-2xl border border-white/10 p-5">
            <label className="text-xs uppercase tracking-[0.18em] text-white/40">Paste multiple tips, one per line</label>
            <textarea
              rows={10}
              value={bulkInput}
              onChange={(event) => setBulkInput(event.target.value)}
              placeholder="BUY XYZ for guaranteed 20% monthly returns\nJoin our premium Telegram group\nPromoter buying secretly, operator active..."
              className="mt-3 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25 resize-none"
            />
            <div className="mt-4 flex justify-end">
              <button onClick={() => void handleBulkAnalyze()} disabled={bulkLoading || !bulkInput.trim()} className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-medium text-black disabled:opacity-60 inline-flex items-center gap-2">
                {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                Analyse All
              </button>
            </div>
          </div>

          {bulkResults.length > 0 && (
            <div className="liquid-glass rounded-2xl border border-white/10 p-4 text-sm text-white/70">
              {bulkSummary.total} tips checked · {bulkSummary.highRisk} high risk · {bulkSummary.safe} safe
            </div>
          )}

          {bulkLoading && <div className="shimmer h-36 rounded-2xl" />}

          {!bulkLoading && bulkResults.length === 0 && (
            <div className="liquid-glass rounded-2xl border border-white/10 p-8 text-center text-white/55">
              Paste up to 10 messages to run a compact bulk scan and spot the riskiest tips first.
            </div>
          )}

          {bulkResults.length > 0 && (
            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-3">
              {bulkResults.map((item) => {
                const expanded = expandedBulk === item.message;
                return (
                  <motion.div key={item.message} variants={staggerItem} className="liquid-glass rounded-2xl border border-white/10 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white truncate">{item.message.slice(0, 60)}</p>
                        <p className="mt-1 text-xs text-white/45">{item.topFlag}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-xs ${riskTone(item.score)}`}>{item.score}</span>
                        <button onClick={() => setExpandedBulk(expanded ? null : item.message)} className="rounded-full border border-white/10 p-2 text-white/55 hover:text-white">
                          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    {expanded && (
                      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/65 space-y-2">
                        <p><span className="text-white">Verdict:</span> {item.verdict}</p>
                        <p><span className="text-white">Top red flag:</span> {item.topFlag}</p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {item.flags.map((flag) => <span key={flag} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">{flag}</span>)}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

