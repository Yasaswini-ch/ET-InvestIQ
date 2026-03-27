import { NextResponse } from "next/server";
import { getIndianMarketData } from "@/lib/yfinance";

export const revalidate = 300; // cache for 5 minutes

export async function GET() {
  try {
    const data = await getIndianMarketData();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Market data fetch failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch market data" },
      { status: 500 }
    );
  }
}
