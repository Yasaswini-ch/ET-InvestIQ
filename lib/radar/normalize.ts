import { RadarEvent, RadarSignal } from "@/lib/types/radar";

function inferSignalType(event: RadarEvent): RadarSignal["type"] {
  if (event.type === "bulk_deal") return "bulk_deal";
  if (event.type === "regulatory") return "regulatory";
  const title = event.title.toLowerCase();
  if (title.includes("insider") || title.includes("promoter")) return "insider_buy";
  if (title.includes("result") || title.includes("earnings")) return "earnings_surprise";
  return "sector_rotation";
}

function inferRiskLevel(type: RadarSignal["type"]): RadarSignal["riskLevel"] {
  if (type === "bulk_deal" || type === "breakout") return "medium";
  if (type === "regulatory") return "high";
  return "low";
}

export function toSignalCandidate(event: RadarEvent): RadarSignal {
  const type = inferSignalType(event);
  const ticker = event.ticker || "NSEI";
  const companyName = event.companyName || ticker.replace(".NS", "");

  return {
    id: event.id,
    type,
    ticker,
    companyName,
    headline: event.title,
    conviction: type === "bulk_deal" ? "high" : "medium",
    riskLevel: inferRiskLevel(type),
    timeframe: "2-8 weeks",
    reasoning: "Signal synthesized from live exchange and regulatory events.",
    catalysts: [event.title],
    risks: ["Event-driven volatility can reverse quickly."],
    eventDate: event.eventDate,
    sourceType: event.source,
    sources: [
      {
        title: event.title,
        url: event.url || "",
        publisher: event.source,
        publishedAt: event.eventDate,
      },
    ],
  };
}

export function normalizeEventsToSignals(events: RadarEvent[]) {
  return events.map(toSignalCandidate);
}
