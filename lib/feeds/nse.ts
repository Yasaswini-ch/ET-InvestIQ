import Papa from "papaparse";
import { RadarEvent } from "@/lib/types/radar";

type CsvRow = Record<string, string>;

function toEvent(row: CsvRow, idx: number): RadarEvent | null {
  const symbol = row.symbol || row.SYMBOL || row["Security Name"];
  const company = row["Security Name"] || row.securityName || symbol;
  const date =
    row.date ||
    row["Date of Purchase / sale"] ||
    row.tradeDate ||
    row["Trade Date"] ||
    new Date().toISOString();
  if (!symbol) return null;

  return {
    id: `nse-${idx}-${symbol}-${date}`,
    source: "NSE",
    type: "bulk_deal",
    ticker: `${String(symbol).toUpperCase()}.NS`,
    companyName: company,
    title: `Bulk deal activity detected in ${symbol}`,
    description: `Client ${row.clientName || row["Client Name"] || "N/A"} traded quantity ${
      row.quantityTraded || row["Quantity Traded"] || row.quantity || "N/A"
    } at average price ${row.avgPrice || row["Average Price"] || row.price || "N/A"}.`,
    url: "https://www.nseindia.com/report-detail/display-bulk-and-block-deals",
    eventDate: String(date),
    metadata: row,
  };
}

export async function fetchNseBulkDeals(from?: string, to?: string): Promise<RadarEvent[]> {
  const fromParam = from || "01-01-2026";
  const toParam = to || "31-12-2026";
  const jsonUrl = `https://www.nseindia.com/api/bulk-deal-archives?from=${encodeURIComponent(
    fromParam
  )}&to=${encodeURIComponent(toParam)}`;

  try {
    const res = await fetch(jsonUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json, text/plain, */*",
        Referer: "https://www.nseindia.com/report-detail/display-bulk-and-block-deals",
      },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      const rows: CsvRow[] = Array.isArray(data) ? data : [];
      return rows
        .map((row, idx) => toEvent(row, idx))
        .filter((item): item is RadarEvent => item !== null);
    }
  } catch {
    // Fallback below
  }

  // Fallback to CSV archive endpoint if JSON path is blocked.
  const csvUrl = "https://nsearchives.nseindia.com/content/equities/bulk.csv";
  const csvRes = await fetch(csvUrl, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 3600 },
  });
  if (!csvRes.ok) {
    throw new Error(`NSE bulk feed failed with ${csvRes.status}`);
  }
  const csv = await csvRes.text();
  const parsed = Papa.parse<CsvRow>(csv, { header: true, skipEmptyLines: true });
  return (parsed.data as CsvRow[])
    .map((row: CsvRow, idx: number) => toEvent(row, idx))
    .filter((item: RadarEvent | null): item is RadarEvent => item !== null);
}
