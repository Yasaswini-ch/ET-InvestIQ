import { ScamAnalysis } from "@/lib/types/scamcheck";

const HIGH_RISK_TERMS = [
  "guaranteed",
  "risk free",
  "risk-free",
  "assured",
  "fixed return",
  "94% accuracy",
  "10x",
  "multibagger",
  "act now",
  "limited seats",
  "offer closes",
  "whatsapp",
  "telegram",
  "premium group",
  "premium plan",
  "operator",
  "insider",
  "secret",
];

function containsAny(message: string, terms: string[]) {
  const lower = message.toLowerCase();
  return terms.filter((term) => lower.includes(term));
}

export function buildScamFallback(message: string, ticker: string | null): ScamAnalysis {
  const lower = message.toLowerCase();
  const hits = containsAny(lower, HIGH_RISK_TERMS);

  const hasGuaranteedReturns = /guaranteed|risk[- ]free|assured|fixed return/.test(lower);
  const hasUrgency = /act now|limited seats|offer closes|last chance|today only|urgent|midnight/.test(lower);
  const hasUnregistered = /sebi registration|no sebi|not registered|whatsapp|telegram|premium group|tips provider/.test(lower);
  const hasReturnClaim = /10x|multibagger|94% accuracy|high accuracy|double your money|monthly return/.test(lower);

  const score =
    10 +
    hits.length * 10 +
    (hasGuaranteedReturns ? 20 : 0) +
    (hasUrgency ? 15 : 0) +
    (hasUnregistered ? 20 : 0) +
    (hasReturnClaim ? 20 : 0);

  const scamProbability = Math.max(0, Math.min(100, score));
  const verdict =
    scamProbability >= 75
      ? "LIKELY SCAM"
      : scamProbability >= 51
        ? "SUSPICIOUS"
        : scamProbability >= 26
          ? "PROBABLY SAFE"
          : "SAFE";

  const redFlags = [
    hasGuaranteedReturns && {
      flag: "Guaranteed returns",
      explanation: "The message promises risk-free or guaranteed gains, which is a classic scam pattern.",
      severity: "HIGH" as const,
    },
    hasUrgency && {
      flag: "Urgency pressure",
      explanation: "The message tries to rush you into acting immediately, which is often used to prevent due diligence.",
      severity: "HIGH" as const,
    },
    hasUnregistered && {
      flag: "Unregistered solicitation",
      explanation: "The message pushes WhatsApp or Telegram subscriptions without any credible SEBI registration context.",
      severity: "HIGH" as const,
    },
    hasReturnClaim && {
      flag: "Unrealistic return claim",
      explanation: "Claims like 10x targets or 94% accuracy are not credible for retail investment tips.",
      severity: "HIGH" as const,
    },
    ticker && {
      flag: "Ticker promotion",
      explanation: `The message mentions ${ticker}, so the claim should be verified against fundamentals, not social proof.`,
      severity: "MEDIUM" as const,
    },
  ].filter(Boolean) as ScamAnalysis["redFlags"];

  const sebiViolations = [
    hasUnregistered ? "Possible unregistered investment advisory solicitation" : null,
    hasGuaranteedReturns ? "Potential misleading return guarantee" : null,
    hasUrgency ? "Potential unfair persuasion / urgency framing" : null,
  ].filter(Boolean) as string[];

  const extractedClaims = [
    ...(hasGuaranteedReturns ? ["risk-free trade"] : []),
    ...(hasUrgency ? ["limited time offer"] : []),
    ...(hasReturnClaim ? ["high accuracy or multibagger claim"] : []),
  ];

  return {
    scamProbability,
    verdict,
    verdictReason:
      verdict === "LIKELY SCAM"
        ? "The message combines guaranteed returns, urgency, and subscription pressure, which strongly indicates a scam."
        : verdict === "SUSPICIOUS"
          ? "The message has multiple promotional red flags that warrant caution and verification."
          : "The message does not strongly match the highest-risk scam patterns, but verification is still recommended.",
    redFlags: redFlags.length > 0
      ? redFlags
      : [
          {
            flag: "Low confidence signal",
            explanation: "The message did not contain a strong scam pattern, but all unsolicited tips should still be verified.",
            severity: "LOW",
          },
        ],
    sebiViolations,
    mentionedTicker: ticker,
    extractedClaims: extractedClaims.length > 0 ? extractedClaims : ["Unverified investment promotion"],
    safeAlternative:
      "Verify the company, avoid paying for tips, check SEBI registration, and use independent research before taking any action.",
    isUnregisteredAdvisor: hasUnregistered,
    guaranteedReturnsFound: hasGuaranteedReturns,
    urgencyTacticsFound: hasUrgency,
  };
}

