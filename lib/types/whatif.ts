export type WhatIfPeriod = "1Y" | "3Y" | "5Y";

export interface WhatIfRequest {
  fundA: string;
  fundB: string;
  amount: number;
  period: WhatIfPeriod;
}

export interface WhatIfChartPoint {
  date: string;
  actual: number;
  simulated: number;
}

export interface WhatIfResponse {
  actualCorpus: number;
  simulatedCorpus: number;
  delta: number;
  deltaPercent: number;
  chartData: WhatIfChartPoint[];
  aiInterpretation: string;
  disclaimer?: string;
}
