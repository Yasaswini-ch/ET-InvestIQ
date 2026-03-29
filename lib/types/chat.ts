export interface PortfolioChatContext {
  investorName?: string;
  riskProfile?: string;
  currentValue?: number;
  overallXIRR?: number;
  portfolioHealthScore?: number;
  topFunds?: { name: string; category: string; currentValue: number; xirr: number }[];
  topInsights?: string[];
  rebalancingSummary?: string;
}

export interface ChatSource {
  title: string;
  url?: string;
  publisher?: string;
  type: "market" | "radar" | "portfolio" | "regulatory" | "price";
  snippet?: string;
}

export interface ChatReasoningStep {
  label: string;
  detail: string;
}

export interface ChatRequestBody {
  messages: { role: "user" | "assistant"; content: string }[];
  portfolioContext?: PortfolioChatContext | null;
  focusTicker?: string | null;
}

export interface ChatResponsePayload {
  answer: string;
  suggested: string[];
  sources: ChatSource[];
  reasoningSteps: ChatReasoningStep[];
}
