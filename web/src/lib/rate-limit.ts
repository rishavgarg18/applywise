/**
 * Best-effort in-memory sliding-window rate limiter.
 *
 * This protects a single warm serverless instance from runaway/abusive request
 * bursts (the credits system already caps metered actions). It is per-instance,
 * so for hard global guarantees in production, back this with a shared store
 * (e.g. Upstash Redis). Kept dependency-free intentionally.
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

const hits = new Map<string, number[]>();

export function rateLimit(
  key: string,
  max = MAX_REQUESTS,
  windowMs = WINDOW_MS
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const cutoff = now - windowMs;
  const timestamps = (hits.get(key) || []).filter((t) => t > cutoff);

  if (timestamps.length >= max) {
    const retryAfter = Math.ceil((timestamps[0] + windowMs - now) / 1000);
    hits.set(key, timestamps);
    return { allowed: false, retryAfter: Math.max(1, retryAfter) };
  }

  timestamps.push(now);
  hits.set(key, timestamps);

  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => t <= cutoff)) hits.delete(k);
    }
  }

  return { allowed: true, retryAfter: 0 };
}
