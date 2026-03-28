"use client"

import { motion } from "framer-motion"
import { Flag } from "lucide-react"
import { RedFlag } from "@/lib/types/scamcheck"

interface RedFlagListProps {
  flags: RedFlag[]
}

function SeverityBadge({ severity }: { severity: string }) {
  if (severity === "HIGH") {
    return (
      <span className="bg-red-500/20 text-red-400 text-xs rounded-full px-2 py-0.5">
        HIGH
      </span>
    )
  }
  if (severity === "MEDIUM") {
    return (
      <span className="bg-yellow-500/20 text-yellow-400 text-xs rounded-full px-2 py-0.5">
        MEDIUM
      </span>
    )
  }
  return (
    <span className="bg-blue-500/20 text-blue-400 text-xs rounded-full px-2 py-0.5">
      LOW
    </span>
  )
}

export default function RedFlagList({ flags }: RedFlagListProps) {
  return (
    <div className="liquid-glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Flag className="w-4 h-4 text-red-400" />
        <span className="text-white font-body font-medium text-sm">Red Flags Detected</span>
        <span className="bg-red-500/20 text-red-400 text-xs rounded-full px-2 py-0.5 ml-1">
          {flags.length}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {flags.map((flag, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="liquid-glass rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-white font-body font-medium text-sm">{flag.flag}</span>
              <SeverityBadge severity={flag.severity} />
            </div>
            <p className="text-white/60 text-xs font-body font-light leading-relaxed">
              {flag.explanation}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
