// Simple in-memory sliding-window rate limiter. Per-instance only — fine for a
// single-region Vercel deployment, not safe across many replicas. Swap for
// Upstash / Redis when the app scales horizontally.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Occasionally garbage-collect expired keys so the Map doesn't grow forever.
function gc(now: number) {
  if (buckets.size < 500) return;
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

export function rateLimit(
  key: string,
  { windowMs, max }: { windowMs: number; max: number },
): RateLimitResult {
  const now = Date.now();
  gc(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    const fresh: Bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, fresh);
    return { ok: true, remaining: max - 1, resetAt: fresh.resetAt, limit: max };
  }

  if (bucket.count >= max) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt, limit: max };
  }

  bucket.count += 1;
  return {
    ok: true,
    remaining: max - bucket.count,
    resetAt: bucket.resetAt,
    limit: max,
  };
}

// Helper: build a rate-limit key from a request. Prefers the authenticated
// user id if one is provided, else falls back to a forwarded IP, else the
// generic bucket "anon".
export function rateLimitKey(
  scope: string,
  userId?: string | null,
  req?: Request,
): string {
  if (userId) return `${scope}:u:${userId}`;
  const fwd = req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req?.headers.get("x-real-ip") ?? "";
  return `${scope}:ip:${fwd || realIp || "anon"}`;
}

export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit":     String(r.limit),
    "X-RateLimit-Remaining": String(r.remaining),
    "X-RateLimit-Reset":     String(Math.ceil(r.resetAt / 1000)),
  };
}
