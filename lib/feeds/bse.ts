import { RadarEvent } from "@/lib/types/radar";

function stripTags(input: string) {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function guessTicker(text: string): string | undefined {
  const match = text.match(/\b([A-Z]{2,15})\b/);
  if (!match) return undefined;
  return `${match[1]}.NS`;
}

export async function fetchBseAnnouncements(): Promise<RadarEvent[]> {
  const res = await fetch("https://www.bseindia.com/corporates/ann.html", {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Referer: "https://www.bseindia.com/",
    },
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error(`BSE announcements failed with ${res.status}`);

  const html = await res.text();

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const rowMatches: string[] = [];
  let rowMatch: RegExpExecArray | null = rowRegex.exec(html);
  while (rowMatch) {
    rowMatches.push(rowMatch[1]);
    rowMatch = rowRegex.exec(html);
  }
  const events: RadarEvent[] = [];

  for (let i = 0; i < rowMatches.length; i += 1) {
    const row = rowMatches[i];
    const text = stripTags(row);
    if (!text || text.length < 20) continue;

    const linkMatch = row.match(/href="([^"]+)"/i);
    const rawUrl = linkMatch?.[1] || "";
    const url = rawUrl.startsWith("http")
      ? rawUrl
      : rawUrl
      ? `https://www.bseindia.com${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`
      : "https://www.bseindia.com/corporates/ann.html";

    const title = text.slice(0, 220);
    const ticker = guessTicker(title);

    events.push({
      id: `bse-${i}-${title.slice(0, 32)}`,
      source: "BSE",
      type: "filing",
      ticker,
      companyName: ticker?.replace(".NS", "") || "BSE Listed Company",
      title,
      description: text,
      url,
      eventDate: new Date().toISOString(),
    });
  }

  return events.slice(0, 40);
}
