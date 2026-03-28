export interface RedFlag {
  flag: string
  explanation: string
  severity: "HIGH" | "MEDIUM" | "LOW"
}

export interface ScamAnalysis {
  scamProbability: number
  verdict: "LIKELY SCAM" | "SUSPICIOUS" | "PROBABLY SAFE" | "SAFE"
  verdictReason: string
  redFlags: RedFlag[]
  sebiViolations: string[]
  mentionedTicker: string | null
  extractedClaims: string[]
  safeAlternative: string
  isUnregisteredAdvisor: boolean
  guaranteedReturnsFound: boolean
  urgencyTacticsFound: boolean
}

export interface VolumeCheck {
  ticker: string | null
  anomalyDetected: boolean
  severity: "HIGH" | "MEDIUM" | "NONE"
  volumeSpike: number
  avgVolume: number
  recentVolume: number
}

export interface ScamCheckResult {
  analysis: ScamAnalysis
  volumeCheck: VolumeCheck | null
  analyzedAt: string
}
