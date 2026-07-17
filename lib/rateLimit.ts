// Simple free rate limiter — no external service needed.
// Tracks request counts per IP in memory. Good enough for the traffic
// scale this app will realistically see (low-to-mid thousands/day).
// NOTE: on Vercel serverless, memory resets per cold start — for a
// stronger guarantee at higher scale later, this can be swapped for
// Vercel KV or Upstash Redis (both have free tiers) without changing
// the calling code below.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Returns true if the request is allowed, false if the IP is rate-limited.
 * @param ip caller's IP address
 * @param limit max requests allowed within the window
 * @param windowMs window size in milliseconds
 */
export function checkRateLimit(ip: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const existing = buckets.get(ip);

  if (!existing || existing.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= limit) {
    return false; // blocked — too many requests from this IP
  }

  existing.count += 1;
  return true;
}

export function getClientIp(headers: Headers): string {
  // Vercel sets this header automatically with the real client IP
  return headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}
