"use client"

import { motion } from "framer-motion"

interface ScoreRingProps {
  score: number
}

function getStrokeColor(score: number): string {
  if (score <= 25) return "#10b981"
  if (score <= 50) return "#3b82f6"
  if (score <= 74) return "#f59e0b"
  return "#ef4444"
}

const CIRCUMFERENCE = 2 * Math.PI * 80 // 502.65

export default function ScoreRing({ score }: ScoreRingProps) {
  const strokeColor = getStrokeColor(score)
  const finalOffset = CIRCUMFERENCE * (1 - score / 100)

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Background track */}
        <circle
          cx={100}
          cy={100}
          r={80}
          fill="none"
          stroke="#ffffff10"
          strokeWidth={12}
        />
        {/* Animated score arc */}
        <motion.circle
          cx={100}
          cy={100}
          r={80}
          fill="none"
          stroke={strokeColor}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: finalOffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          transform="rotate(-90 100 100)"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-heading italic text-white leading-none">{score}</span>
        <span className="text-white/40 text-xs font-body mt-1">/100</span>
      </div>
    </div>
  )
}
