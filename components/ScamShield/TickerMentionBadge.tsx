"use client"

import { TrendingUp } from "lucide-react"

interface TickerMentionBadgeProps {
  ticker: string
}

export default function TickerMentionBadge({ ticker }: TickerMentionBadgeProps) {
  return (
    <div className="liquid-glass rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
      <TrendingUp className="w-4 h-4 text-yellow-400 shrink-0" />
      <span className="text-white/50 text-xs font-body">Ticker detected in message:</span>
      <span className="text-white font-body font-medium text-sm">{ticker}</span>
      <span className="text-white/40 text-xs font-body hidden sm:inline">
        — volume cross-referenced against 30-day history
      </span>
    </div>
  )
}
