import { NextRequest } from "next/server";
import { generateStructuredJSON } from "@/lib/gemini";
import { rateLimit, getIP } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  if (!rateLimit(ip, 5, 60_000)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const { fundName, monthlyAmount, startYear, startMonth } = await req.json();

  const SYSTEM = `You are an Indian mutual fund calculator. Return only valid JSON.`;

  const prompt = `
Calculate a SIP time machine result for:
- Fund: ${fundName}
- Monthly SIP: ₹${monthlyAmount}
- Start: ${startMonth}/${startYear}
- End: Today (${new Date().toLocaleDateString("en-IN")})

Use your knowledge of this fund's actual historical NAV performance.
Calculate month by month (approximate NAV growth based on fund category/actual returns).

Return:
{
  "fundName": string,
  "fundCategory": string,
  "monthlyAmount": number,
  "startDate": string,
  "totalMonths": number,
  "totalInvested": number,
  "currentCorpus": number,
  "wealthGained": number,
  "xirr": number,
  "vsFixedDeposit": number,
  "vsNifty50": number,
  "monthlyData": [
    { "month": "Jan 2020", "invested": number, "corpus": number }
  ],
  "verdict": "One punchy sentence like 'Your patience created ₹X in extra wealth'",
  "futureProjection": {
    "nextTenYears": {
      "monthlyAmount": number,
      "assumedXIRR": number,
      "projectedCorpus": number,
      "totalInvested": number
    }
  },
  "funFact": "One surprising insight about this fund or the power of SIP"
}

Include monthly data from start to today. If fund name is vague, use the closest matching well-known Indian fund.
`;

  try {
    const result = await generateStructuredJSON<any>(prompt, SYSTEM);
    return Response.json(result);
  } catch {
    return Response.json({ error: "Calculation failed" }, { status: 500 });
  }
}
