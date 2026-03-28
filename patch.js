const fs = require('fs');
const path = require('path');

const rateLimits = {
  'xray': 3,
  'chat': 5,
  'radar': 10,
  'charts': 8,
};

function patchRoutes() {
  const apiDir = 'c:/Opensource/etgenai/app/api';
  const dirs = fs.readdirSync(apiDir, { withFileTypes: true });
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    const routeFile = path.join(apiDir, d.name, 'route.ts');
    if (fs.existsSync(routeFile)) {
      let content = fs.readFileSync(routeFile, 'utf8');
      
      // Don't patch if it already imports rateLimit
      if (!content.includes('import { rateLimit')) {
        let max = rateLimits[d.name] || 5;
        let importStmt = 'import { rateLimit, getIP } from "@/lib/rateLimit";\n';
        content = importStmt + content;
        
        const rateLimitLines = `
  const ip = getIP(req);
  if (!rateLimit(ip, ${max}, 60_000)) {
    return Response.json(
      { error: "Too many requests. Please wait a minute." },
      { status: 429 }
    );
  }
`;

        // insert rate limit check at the start of POST or GET handler
        content = content.replace(/export (?:async )?function (GET|POST)\(req: NextRequest\) \{/g,
          `export async function $1(req: NextRequest) {${rateLimitLines}`
        );
        fs.writeFileSync(routeFile, content);
      }
    }
  }
}
patchRoutes();
