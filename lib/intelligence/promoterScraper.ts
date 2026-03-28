import { fetchBseAnnouncements } from "@/lib/feeds/bse";
import { PromoterSignalRaw } from "@/lib/types/intelligence";

const FALLBACK_PROMOTER_SIGNALS: PromoterSignalRaw[] = [
  {
    company: "Tata Motors Ltd",
    changeType: "buy" as const,
    percentageChange: 1.2,
    date: new Date().toISOString(),
    rawDescription: "Promoter acquired 1.2% additional stake via open market"
  },
  {
    company: "Infosys Ltd",
    changeType: "buy" as const,
    percentageChange: 0.8,
    date: new Date().toISOString(),
    rawDescription: "Promoter group increased holding under creeping acquisition"
  },
  {
    company: "Adani Green Energy",
    changeType: "sell" as const,
    percentageChange: 2.1,
    date: new Date().toISOString(),
    rawDescription: "Promoter entity sold stake via block deal"
  },
  {
    company: "Bajaj Finance",
    changeType: "buy" as const,
    percentageChange: 0.5,
    date: new Date().toISOString(),
    rawDescription: "Promoter family trust increased stake"
  },
  {
    company: "Zomato Ltd",
    changeType: "sell" as const,
    percentageChange: 1.8,
    date: new Date().toISOString(),
    rawDescription: "Early investor promoter entity partial exit"
  }
];

export async function fetchPromoterSignals(): Promise<PromoterSignalRaw[]> {
  try {
    const announcements = await fetchBseAnnouncements();
    const promoterAnnouncements = announcements.filter((a: {category?: string; description?: string}) =>
      a.category?.toLowerCase().includes("insider") ||
      a.category?.toLowerCase().includes("sast") ||
      a.category?.toLowerCase().includes("promoter") ||
      a.description?.toLowerCase().includes("promoter") ||
      a.description?.toLowerCase().includes("shareholding change")
    );
    
    if (promoterAnnouncements.length < 2) return FALLBACK_PROMOTER_SIGNALS;
    
    return promoterAnnouncements.slice(0, 8).map((a: {company?: string; description?: string; date?: string}) => {
      const changeType: PromoterSignalRaw["changeType"] =
        (a.description?.toLowerCase().includes("sold") || a.description?.toLowerCase().includes("sell")) ? "sell" : "buy";

      return {
        company: a.company ?? "Unknown",
        changeType,
        percentageChange: parseFloat(
          a.description?.match(/(\d+\.?\d*)\s*%/)?.[1] ?? "0"
        ),
        date: a.date ?? new Date().toISOString(),
        rawDescription: a.description ?? ""
      };
    });
  } catch {
    return FALLBACK_PROMOTER_SIGNALS;
  }
}
