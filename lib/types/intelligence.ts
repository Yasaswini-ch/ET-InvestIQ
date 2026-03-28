export interface BudgetAnnouncement {
  id: string
  title: string
  category: "taxation" | "sectoral" | "asset_class" | "retirement"
  shortText: string
  fullText: string
  affectsAssetClasses: string[]
  severity: "high" | "medium" | "low"
}

export interface BudgetImpactItem {
  announcementId: string
  announcementTitle: string
  impactOnInvestor: string
  rupeesImpact: string
  urgency: "act_now" | "review_before_april" | "monitor" | "no_action"
  action: string
  affectedFunds: string[]
}

export interface BudgetAnalysisResult {
  overallImpact: "positive" | "neutral" | "negative"
  impactSummary: string
  items: BudgetImpactItem[]
  topAction: string
  deadline: string | null
}

export interface PromoterSignalRaw {
  company: string
  changeType: "buy" | "sell"
  percentageChange: number
  date: string
  rawDescription: string
}

export interface PromoterSignalEnriched {
  company: string
  ticker: string
  changeType: "buy" | "sell"
  percentageChange: number
  date: string
  convictionScore: number
  convictionReason: string
  historicalContext: string
  retailSignal: "strong_buy_signal" | "watch" | "sell_signal" | "noise"
  riskFactors: string[]
  relatedSector: string
}

export interface PromoterAnalysis {
  signals: PromoterSignalEnriched[]
  marketTheme: string
  smartMoneyMood: "accumulating" | "distributing" | "mixed"
  topSignal: string
}

export interface StayCourseMath {
  drawdownPercent: number
  discountedUnitsThisMonth: number
  normalUnitsAtPeak: number
  bonusUnits: number
  bonusUnitsPercent: number
  opportunityCost: number
  projectedCorpus10yr: number
}

export interface StayCourseInsight {
  emotionalTrigger: string
  historicalParallel: string
  unitAccumulationInsight: string
  recoveryTimeline: string
  commitmentStatement: string
}

export interface StayCourseResult {
  math: StayCourseMath
  insight: StayCourseInsight
  niftyContext: {
    isMarketDown: boolean
    drawdownFromPeak: number
  }
}
