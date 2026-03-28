"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Shield,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Scale,
} from "lucide-react"
import AppShell from "@/components/AppShell"
import PageHeader from "@/components/PageHeader"
import ScoreRing from "@/components/ScamShield/ScoreRing"
import RedFlagList from "@/components/ScamShield/RedFlagList"
import VolumeAnomalyCard from "@/components/ScamShield/VolumeAnomalyCard"
import TickerMentionBadge from "@/components/ScamShield/TickerMentionBadge"
import SampleMessages from "@/components/ScamShield/SampleMessages"
import { ScamCheckResult } from "@/lib/types/scamcheck"

function VerdictBadge({ verdict }: { verdict: string }) {
  if (verdict === "LIKELY SCAM") {
    return (
      <span className="bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-4 py-1.5 text-sm font-body font-medium">
        {verdict}
      </span>
    )
  }
  if (verdict === "SUSPICIOUS") {
    return (
      <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full px-4 py-1.5 text-sm font-body font-medium">
        {verdict}
      </span>
    )
  }
  if (verdict === "PROBABLY SAFE") {
    return (
      <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full px-4 py-1.5 text-sm font-body font-medium">
        {verdict}
      </span>
    )
  }
  return (
    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-4 py-1.5 text-sm font-body font-medium">
      {verdict}
    </span>
  )
}

interface BoolFlagRowProps {
  label: string
  value: boolean
}

function BoolFlagRow({ label, value }: BoolFlagRowProps) {
  return (
    <div className="liquid-glass rounded-xl px-4 py-3 flex items-center justify-between">
      <span className="text-white/70 text-xs font-body">{label}</span>
      {value ? (
        <XCircle className="w-4 h-4 text-red-400" />
      ) : (
        <CheckCircle className="w-4 h-4 text-emerald-400" />
      )}
    </div>
  )
}

export default function ScamCheckPage() {
  const [message, setMessage] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<ScamCheckResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [charCount, setCharCount] = useState(0)

  function handleMessageChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setMessage(e.target.value)
    setCharCount(e.target.value.length)
  }

  function handleSampleSelect(sample: string) {
    setMessage(sample)
    setCharCount(sample.length)
    setResult(null)
    setError(null)
  }

  async function handleAnalyze() {
    if (!message.trim()) return
    setIsAnalyzing(true)
    setError(null)
    setResult(null)
    try {
      const response = await fetch("/api/scamcheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      })
      if (!response.ok) {
        const errData = await response.json() as { error?: string }
        throw new Error(errData.error ?? "Analysis failed")
      }
      const data = await response.json() as ScamCheckResult
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const analysis = result?.analysis

  return (
    <AppShell>
      <PageHeader
        title="Scam Shield"
        description="Paste any suspicious investment message. AI will tell you if it's a scam."
        action={<Shield className="w-8 h-8 text-emerald-400" />}
      />

      {/* SECTION B — Input Area */}
      <div className="liquid-glass rounded-2xl p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white/70 text-sm font-body font-medium">
            Paste the suspicious message
          </span>
          <span className="bg-white/10 text-white/50 text-xs rounded-full px-2.5 py-1 font-body">
            {charCount} chars
          </span>
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
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !message.trim()}
            className="liquid-glass-strong rounded-full px-8 py-3 font-body font-medium text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition hover:bg-white/10"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analysing…
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Analyse for Scams
              </>
            )}
          </button>
        </div>

        {error && (
          <p className="mt-3 text-red-400 text-sm font-body text-center">{error}</p>
        )}
      </div>

      {/* SECTION C — Results */}
      {result && analysis && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-10 max-w-6xl mx-auto"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-1">
              <div className="liquid-glass rounded-2xl p-6 flex flex-col items-center">
                <ScoreRing score={analysis.scamProbability} />
                <div className="mt-4">
                  <VerdictBadge verdict={analysis.verdict} />
                </div>
                <p className="text-white/60 text-sm font-body font-light text-center mt-3 leading-relaxed">
                  {analysis.verdictReason}
                </p>

                <div className="mt-4 flex flex-col gap-2 w-full">
                  <BoolFlagRow label="Guaranteed Returns" value={analysis.guaranteedReturnsFound} />
                  <BoolFlagRow label="Urgency Tactics" value={analysis.urgencyTacticsFound} />
                  <BoolFlagRow label="Unregistered Advisor" value={analysis.isUnregisteredAdvisor} />
                </div>
              </div>

              <VolumeAnomalyCard volumeCheck={result.volumeCheck} />
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {analysis.mentionedTicker && (
                <TickerMentionBadge ticker={analysis.mentionedTicker} />
              )}

              <RedFlagList flags={analysis.redFlags} />

              {analysis.extractedClaims.length > 0 && (
                <div className="liquid-glass rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <span className="text-white font-body font-medium text-sm">
                      Exaggerated Claims Found
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.extractedClaims.map((claim, i) => (
                      <span
                        key={i}
                        className="bg-yellow-500/10 text-yellow-300 text-xs rounded-full px-3 py-1 font-body"
                      >
                        {claim}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {analysis.sebiViolations.length > 0 && (
                <div className="liquid-glass rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Scale className="w-4 h-4 text-red-400" />
                    <span className="text-white font-body font-medium text-sm">
                      Potential SEBI Violations
                    </span>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {analysis.sebiViolations.map((violation, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-white/70 text-sm font-body font-light"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                        {violation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="liquid-glass rounded-2xl p-5 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-white font-body font-medium text-sm">What to do instead</span>
                </div>
                <p className="text-white/70 text-sm font-body font-light leading-relaxed">
                  {analysis.safeAlternative}
                </p>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-white/30 text-xs font-body text-center mt-8 leading-relaxed">
            This analysis is AI-generated and for educational purposes only. Always verify
            with SEBI&apos;s official investor portal at investor.sebi.gov.in before making any
            investment decisions.
          </p>
        </motion.div>
      )}
    </AppShell>
  )
}
