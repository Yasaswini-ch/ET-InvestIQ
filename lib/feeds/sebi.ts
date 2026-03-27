import { XMLParser } from "fast-xml-parser";
import { RadarEvent } from "@/lib/types/radar";

function normalizeItems(items: unknown): any[] {
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
}

export async function fetchSebiFeed(): Promise<RadarEvent[]> {
  const res = await fetch("https://www.sebi.gov.in/sebirss.xml", {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 1800 },
  });
  if (!res.ok) {
    throw new Error(`SEBI feed failed with ${res.status}`);
  }

  const xml = await res.text();
  const parser = new XMLParser();
  const parsed = parser.parse(xml);
  const items = normalizeItems(parsed?.rss?.channel?.item);

  return items
    .map((item: any, idx) => ({
      id: `sebi-${idx}-${String(item?.link ?? idx)}`,
      source: "SEBI" as const,
      type: "regulatory" as const,
      title: String(item?.title ?? "SEBI Update"),
      description: String(item?.description ?? ""),
      url: String(item?.link ?? ""),
      eventDate: String(item?.pubDate ?? new Date().toISOString()),
    }))
    .filter((item: RadarEvent) => !!item.title);
}
