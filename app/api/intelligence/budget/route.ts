import { NextResponse } from 'next/server';
import { generateStructuredJSON } from '@/lib/gemini';
import { BUDGET_2026_ANNOUNCEMENTS } from '@/lib/intelligence/budgetAnnouncements';
import { rateLimit, getIP } from '@/lib/rateLimit';
import { buildBudgetFallback } from '@/lib/intelligence/fallbacks';

const AI_TIMEOUT_MS = 12000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timed out")), timeoutMs)),
  ]);
}

export async function POST(req: Request) {
  const ip = getIP(req);
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const { selectedAnnouncements, portfolioContext } = await req.json();

    if (!selectedAnnouncements || !Array.isArray(selectedAnnouncements) || selectedAnnouncements.length === 0) {
      return NextResponse.json({ error: "Missing selected announcements" }, { status: 400 });
    }

    const announcementsDetail = BUDGET_2026_ANNOUNCEMENTS.filter(a => selectedAnnouncements.includes(a.id));
    
    if (announcementsDetail.length === 0) {
      return NextResponse.json({ error: "No valid announcements found" }, { status: 400 });
    }

    const portfolioSummary = portfolioContext
      ? JSON.stringify(portfolioContext, null, 2)
      : "No portfolio uploaded - give general impact";

    const systemPrompt = `You are a SEBI-aware Indian tax and investment analyst. You specialize in explaining exactly how Union Budget changes affect a retail investor's mutual fund and equity portfolio in concrete rupee terms. Return ONLY valid JSON. No markdown.`;

    const userPrompt = `Budget 2026-27 announcements selected by this investor:
${JSON.stringify(announcementsDetail, null, 2)}

Return exactly one item in the items array for EACH of these announcement IDs: ${selectedAnnouncements.join(", ")}.
Do not merge or combine items. One object per announcement.

Investor portfolio:
${portfolioSummary}

Return this JSON:
{
  "overallImpact": "positive" | "neutral" | "negative",
  "impactSummary": "2-3 sentence plain-English summary of net impact",
  "items": [
    {
      "announcementId": "string",
      "announcementTitle": "string",
      "impactOnInvestor": "string",
      "rupeesImpact": "string",
      "urgency": "act_now" | "review_before_april" | "monitor" | "no_action",
      "action": "string",
      "affectedFunds": ["string array of fund names"]
    }
  ],
  "topAction": "string (single most important action)",
  "deadline": "string | null (e.g. 'Before March 31, 2026')"
}`;

    try {
      const json = await withTimeout(generateStructuredJSON(userPrompt, systemPrompt), AI_TIMEOUT_MS);
      return NextResponse.json(json);
    } catch (aiError) {
      console.error("Budget AI fallback used:", aiError);
      return NextResponse.json(buildBudgetFallback(announcementsDetail, portfolioContext));
    }

  } catch (error) {
    console.error("Budget API error:", error);
    return NextResponse.json({ error: "Failed to process budget impact" }, { status: 500 });
  }
}
