const hits = new Map<string, number[]>();

export function rateLimit(
  ip: string,
  max: number = 5,
  windowMs: number = 60_000
): boolean {
  const now = Date.now();
  const prev = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (prev.length >= max) return false;
  hits.set(ip, [...prev, now]);
  return true;
}

export function getIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  );
}
