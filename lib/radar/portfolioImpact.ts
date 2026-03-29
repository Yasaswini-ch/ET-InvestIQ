import { PortfolioChatContext } from "@/lib/types/chat";
import { RadarSignal } from "@/lib/types/radar";

export interface RadarPortfolioHolding {
  stock: string;
  totalExposurePercent: number;
}

export interface RadarPortfolioFund {
  name: string;
  category?: string;
  currentValue?: number;
}

export interface RadarPortfolioSnapshot extends PortfolioChatContext {
  currentValue?: number;
  funds?: RadarPortfolioFund[];
  topHoldings?: RadarPortfolioHolding[];
}

export interface RadarPortfolioImpact {
  status: "direct" | "thematic" | "none";
  title: string;
  detail: string;
  matchedHolding?: string;
  exposurePercent?: number;
}

const SECTOR_KEYWORDS: Record<string, string[]> = {
  banking: ["bank", "hdfc", "icici", "sbi", "kotak", "axis", "bfsi", "financial"],
  it: ["infosys", "tcs", "wipro", "tech", "it", "hcl"],
  pharma: ["pharma", "sun pharmaceutical", "dr reddy", "cipla", "healthcare"],
  auto: ["tata motors", "maruti", "mahindra", "auto", "vehicle"],
  energy: ["reliance", "ongc", "power", "energy", "oil", "gas"],
};

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function findSectorKeywords(signal: RadarSignal) {
  const text = normalizeText(`${signal.companyName} ${signal.headline} ${signal.sector ?? ""}`);
  return Object.entries(SECTOR_KEYWORDS).find(([, keywords]) =>
    keywords.some((keyword) => text.includes(keyword))
  )?.[1] ?? [];
}

export function getRadarPortfolioImpact(
  signal: RadarSignal,
  portfolio: RadarPortfolioSnapshot | null
): RadarPortfolioImpact {
  if (!portfolio) {
    return {
      status: "none",
      title: "No portfolio context loaded",
      detail: "Run Portfolio X-Ray to see whether this signal affects your current holdings.",
    };
  }

  const normalizedCompany = normalizeText(signal.companyName);
  const topHoldings = Array.isArray(portfolio.topHoldings) ? portfolio.topHoldings : [];
  const directHolding = topHoldings.find((holding) => {
    const holdingName = normalizeText(holding.stock);
    return (
      holdingName.includes(normalizedCompany) ||
      normalizedCompany.includes(holdingName) ||
      normalizeText(signal.ticker.replace(".NS", "")).includes(holdingName.replace(/\s+/g, ""))
    );
  });

  if (directHolding) {
    return {
      status: "direct",
      title: "Direct portfolio exposure",
      detail: `${directHolding.stock} already appears in your latest X-Ray snapshot, so this signal can directly influence your portfolio path.`,
      matchedHolding: directHolding.stock,
      exposurePercent: directHolding.totalExposurePercent,
    };
  }

  const keywords = findSectorKeywords(signal);
  const funds = Array.isArray(portfolio.funds) ? portfolio.funds : portfolio.topFunds ?? [];
  const thematicFund = funds.find((fund) => {
    const haystack = normalizeText(`${fund.name} ${fund.category ?? ""}`);
    return keywords.some((keyword) => haystack.includes(keyword));
  });

  if (thematicFund) {
    const exposureBase = typeof thematicFund.currentValue === "number" && typeof portfolio.currentValue === "number" && portfolio.currentValue > 0
      ? Number(((thematicFund.currentValue / portfolio.currentValue) * 100).toFixed(1))
      : undefined;
    return {
      status: "thematic",
      title: "Theme overlap detected",
      detail: `${thematicFund.name} suggests indirect exposure to the same theme, so this signal may still matter to your holdings even without a direct stock match.`,
      matchedHolding: thematicFund.name,
      exposurePercent: exposureBase,
    };
  }

  return {
    status: "none",
    title: "No strong portfolio overlap",
    detail: "This signal does not map clearly to your latest X-Ray snapshot, so it looks more like a new watchlist idea than an existing portfolio risk.",
  };
}
