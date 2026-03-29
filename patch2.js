const fs = require('fs');

// 1. app/layout.tsx
let layout = fs.readFileSync('c:/Opensource/etgenai/app/layout.tsx', 'utf8');
if (!layout.includes('DisclaimerBanner')) {
  layout = layout.replace('import AppShell from "@/components/AppShell";', 
                          'import AppShell from "@/components/AppShell";\nimport DisclaimerBanner from "@/components/DisclaimerBanner";');
  layout = layout.replace('</body>', '  <DisclaimerBanner />\n      </body>');
  fs.writeFileSync('c:/Opensource/etgenai/app/layout.tsx', layout);
}

// 2. components/AppShell.tsx
let shell = fs.readFileSync('c:/Opensource/etgenai/components/AppShell.tsx', 'utf8');
if (!shell.includes('"/briefing"')) {
  shell = shell.replace('{ label: "Chat", href: "/chat" },',
                        '{ label: "My Briefing", href: "/briefing", accent: "text-emerald-400 glow" },\n  { label: "Chat", href: "/chat" },');
  shell = shell.replace('{ label: "Learn", href: "/newbies" },',
                        '{ label: "SIP Tools", href: "/sip" },\n  { label: "Learn", href: "/newbies" },');
  fs.writeFileSync('c:/Opensource/etgenai/components/AppShell.tsx', shell);
}

// 3. app/xray/page.tsx
let xray = fs.readFileSync('c:/Opensource/etgenai/app/xray/page.tsx', 'utf8');
if (!xray.includes('ShareCard')) {
  xray = xray.replace('import { formatCompactINR, formatINR } from "@/lib/utils";',
                      'import { formatCompactINR, formatINR } from "@/lib/utils";\nimport ShareCard from "@/components/ShareCard";');
  
  // modify localstorage
  if (!xray.includes('localStorage.setItem("xray_result"')) {
    xray = xray.replace('localStorage.setItem("et_portfolio_context", JSON.stringify(portfolioContext));',
                        'localStorage.setItem("et_portfolio_context", JSON.stringify(portfolioContext));\n        localStorage.setItem("xray_result", JSON.stringify(data));');
  }

  // Add ShareCard component after HealthScoreRing in results
  xray = xray.replace('<p className="mt-4 text-xs font-bold text-white/60 uppercase tracking-widest">Portfolio Health</p>',
                      '<p className="mt-4 text-xs font-bold text-white/60 uppercase tracking-widest">Portfolio Health</p>\n          <div className="mt-6 w-full">\n            <ShareCard investorName={analysis.investorName} healthScore={analysis.portfolioHealthScore} xirr={analysis.overallXIRR} currentValue={analysis.currentValue} alpha={analysis.benchmarkComparison?.alpha || 0} />\n          </div>');
  
  fs.writeFileSync('c:/Opensource/etgenai/app/xray/page.tsx', xray);
}

// 4. app/api/xray/route.ts
let xrayApi = fs.readFileSync('c:/Opensource/etgenai/app/api/xray/route.ts', 'utf8');
if (!xrayApi.includes('isPDF')) {
  xrayApi = xrayApi.replace('if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });',
                            `if (!file && !useSample) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File too large. Maximum size is 10MB." },
          { status: 413 }
        );
      }
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json(
          { error: "Only PDF files are accepted." },
          { status: 400 }
        );
      }
      const headerBuffer = await file.arrayBuffer();
      const header = new Uint8Array(headerBuffer.slice(0, 4));
      const isPDF =
        header[0] === 0x25 &&
        header[1] === 0x50 &&
        header[2] === 0x44 &&
        header[3] === 0x46;
      if (!isPDF) {
        return NextResponse.json(
          { error: "Invalid file format. Please upload a real PDF." },
          { status: 400 }
        );
      }
    }`);
  fs.writeFileSync('c:/Opensource/etgenai/app/api/xray/route.ts', xrayApi);
}

// 5. app/api/chat/route.ts
let chatApi = fs.readFileSync('c:/Opensource/etgenai/app/api/chat/route.ts', 'utf8');
if (!chatApi.includes('MAX_MSG_LENGTH')) {
  chatApi = chatApi.replace('const messages = body.messages || [];',
                            `const MAX_MSG_LENGTH = 600;
    const MAX_MESSAGES = 10;
    const rawMessages = body.messages || [];
    const messages = rawMessages
      .slice(-MAX_MESSAGES)
      .map((m: any) => ({
        role: m.role,
        content: String(m.content).slice(0, MAX_MSG_LENGTH),
      }));`);
  fs.writeFileSync('c:/Opensource/etgenai/app/api/chat/route.ts', chatApi);
}
