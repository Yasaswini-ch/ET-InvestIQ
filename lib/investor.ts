export function getInvestorName(): string {
  if (typeof window === "undefined") return "Investor";
  return localStorage.getItem("investor_name") ?? "Investor";
}

export function setInvestorName(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("investor_name", name);
}

export const DEMO_INVESTOR = {
  name: "Demo Investor",
  portfolioId: "SAMPLE-2026",
} as const;
