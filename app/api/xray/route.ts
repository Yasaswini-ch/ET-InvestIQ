import { NextRequest, NextResponse } from "next/server"; 
 import pdfParse from "pdf-parse"; 
 import { generateJSON } from "@/lib/gemini"; 
 
 const SYSTEM = `You are an expert Indian mutual fund analyst with 15 years experience. 
 Analyze CAMS/KFintech portfolio statements with precision. 
 Always return valid JSON only. No markdown, no explanation outside JSON.`; 
 
 const PROMPT_TEMPLATE = (text: string) => ` 
 Analyze this mutual fund portfolio statement and return a JSON object: 
 
 STATEMENT TEXT: 
 ${text.slice(0, 50000)} 
 
 Return this exact JSON structure: 
 { 
   "investorName": string, 
   "panMasked": string, 
   "statementDate": string, 
   "totalInvested": number, 
   "currentValue": number, 
   "totalGain": number, 
   "gainPercent": number, 
   "overallXIRR": number, 
   "portfolioHealthScore": number, 
   "riskProfile": "aggressive" | "moderate" | "conservative", 
   "funds": [ 
     { 
       "name": string, 
       "amc": string, 
       "category": "Large Cap" | "Mid Cap" | "Small Cap" | "Flexi Cap" | "ELSS" | "Index" | "Debt" | "Hybrid" | "Sectoral", 
       "invested": number, 
       "currentValue": number, 
       "units": number, 
       "nav": number, 
       "xirr": number, 
       "expenseRatio": number, 
       "overlapScore": number, 
       "allocationPercent": number, 
       "recommendation": "hold" | "increase" | "reduce" | "exit", 
       "recommendationReason": string 
     } 
   ], 
   "insights": [ 
     { "type": "warning" | "success" | "info", "title": string, "description": string } 
   ], 
   "rebalancingPlan": { 
     "summary": string, 
     "urgency": "high" | "medium" | "low", 
     "actions": [ 
       { "action": string, "fund": string, "reason": string, "priority": "high" | "medium" | "low" } 
     ], 
     "expectedImpact": string, 
     "estimatedAnnualSavings": number 
   }, 
   "expenseDragAnnual": number, 
   "overlapMatrix": [ 
     { "fund1": string, "fund2": string, "overlapPercent": number } 
   ], 
   "benchmarkComparison": { 
     "portfolioReturn": number, 
     "nifty50Return": number, 
     "alpha": number 
   }, 
   "diversificationScore": number, 
   "topHoldings": [ 
     { "stock": string, "totalExposurePercent": number } 
   ] 
 } 
 
 Instructions: 
 - Be realistic and specific with Indian fund names and AMCs 
 - XIRR should be annualized percentage (e.g. 18.4 means 18.4%) 
 - Health score 0-100: penalize overlap, high expense ratios, concentration 
 - If statement text is missing data, make intelligent estimates based on fund category norms 
 - overlapMatrix: list pairs with >30% overlap only 
 - topHoldings: top 5 stocks across all funds combined 
 `; 
 
 export async function POST(req: NextRequest) { 
   try { 
     const formData = await req.formData(); 
     const file = formData.get("pdf") as File; 
     const useSample = formData.get("useSample") === "true"; 
 
     if (useSample) { 
       const { samplePortfolio } = await import("@/lib/samplePortfolio"); 
       return NextResponse.json(samplePortfolio); 
     } 
 
     if (!file) return NextResponse.json({ error: "No file" }, { status: 400 }); 
 
     const buffer = Buffer.from(await file.arrayBuffer()); 
     const parsed = await pdfParse(buffer); 
     const text = parsed.text; 
 
     if (!text || text.length < 100) { 
       return NextResponse.json({ error: "Could not read PDF. Try sample portfolio." }, { status: 422 }); 
     } 
 
     const analysis = await generateJSON(PROMPT_TEMPLATE(text), SYSTEM); 
     return NextResponse.json(analysis); 
   } catch (err) { 
     console.error(err); 
     return NextResponse.json({ error: "Analysis failed. Try sample portfolio." }, { status: 500 }); 
   } 
 }