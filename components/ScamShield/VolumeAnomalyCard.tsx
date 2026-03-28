"use client"

import { BarChart3, ShieldCheck } from "lucide-react"
import { VolumeCheck } from "@/lib/types/scamcheck"

interface VolumeAnomalyCardProps {
  volumeCheck: VolumeCheck | null
}

export default function VolumeAnomalyCard({ volumeCheck }: VolumeAnomalyCardProps) {
  return (
    <div className="liquid-glass rounded-2xl p-5 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-white/50" />
        <span className="text-white font-body font-medium text-sm">Volume Anomaly Check</span>
      </div>

      {volumeCheck === null ? (
        <p className="text-white/40 text-xs font-body font-light">
          Volume data unavailable for this message.
        </p>
      ) : volumeCheck.anomalyDetected ? (
        <div>
          <div className="flex items-center gap-2 mb-2">
            {volumeCheck.ticker && (
              <span className="bg-white/10 text-white/70 text-xs rounded-full px-2 py-0.5 font-body">
                {volumeCheck.ticker}
              </span>
            )}
            <span
              className={`text-xs rounded-full px-2 py-0.5 font-body ${
                volumeCheck.severity === "HIGH"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-yellow-500/20 text-yellow-400"
              }`}
            >
              {volumeCheck.severity}
            </span>
          </div>
          <p
            className={`text-sm font-body font-medium mb-1 ${
              volumeCheck.severity === "HIGH" ? "text-red-400" : "text-yellow-400"
            }`}
          >
            Recent volume is {volumeCheck.volumeSpike.toFixed(1)}x higher than the 30-day average
          </p>
          <p className="text-white/50 text-xs font-body font-light">
            Unusual volume often precedes pump-and-dump activity.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <p className="text-emerald-400 text-sm font-body">
            No unusual volume detected for {volumeCheck.ticker ?? "this ticker"}.
          </p>
        </div>
      )}
    </div>
  )
}
