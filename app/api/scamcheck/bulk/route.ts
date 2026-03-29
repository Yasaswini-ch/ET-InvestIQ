import { NextRequest, NextResponse } from "next/server";
import { getIP, rateLimit } from "@/lib/rateLimit";
import { runScamAnalysis } from "@/lib/scamcheck/service";

interface BulkResult {
  message: string;
  score: number;
  topFlag: string;
  flags: string[];
  verdict: string;
}

interface BulkResponse {
  results: BulkResult[];
}

function buildFallbackBulk(messages: string[]): BulkResponse {
  return {
    results: messages.map((message) => {
      const lower = message.toLowerCase();
      const keywords = [
        "guaranteed",
        "risk free",
        "multibagger",
        "telegram",
        "whatsapp",
        "premium group",
        "act now",
        "limited seats",
        "operator",
        "insider",
      ].filter((term) => lower.includes(term));

      const score = Math.min(100, 15 + keywords.length * 12);
      const verdict = score > 70 ? "LIKELY SCAM" : score > 40 ? "SUSPICIOUS" : "SAFE";

      return {
        message,
        score,
        topFlag: keywords[0] ? `Keyword trigger: ${keywords[0]}` : "No major keyword trigger found",
        flags: keywords.length ? keywords : ["Low-confidence rule-based review"],
        verdict,
      };
    }),
  };
}

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  if (!rateLimit(ip, 4, 60_000)) {
    return NextResponse.json(buildFallbackBulk([]), { status: 429 });
  }

  let messages: string[] = [];

  try {
    const body = (await req.json().catch(() => ({}))) as { messages?: unknown };
    messages = Array.isArray(body.messages)
      ? body.messages.map((value) => String(value).trim()).filter(Boolean).slice(0, 10)
      : [];

    if (!messages.length) {
      return NextResponse.json({ results: [] } satisfies BulkResponse);
    }

    if (Array.isArray(body.messages) && body.messages.length > 10) {
      return NextResponse.json(buildFallbackBulk(messages));
    }

    const analyses = await Promise.all(messages.map((message) => runScamAnalysis(message)));

    return NextResponse.json({
      results: analyses.map((analysis, index) => ({
        message: messages[index],
        score: analysis.scamProbability,
        topFlag: analysis.redFlags[0]?.flag ?? "No major red flag found",
        flags: analysis.redFlags.map((flag) => flag.flag),
        verdict: analysis.verdict,
      })),
    } satisfies BulkResponse);
  } catch (error) {
    console.error("Bulk scamcheck API failed:", error);
    return NextResponse.json(buildFallbackBulk(messages));
  }
}

