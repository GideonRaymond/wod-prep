import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "./redis";

const HOUR_MS = 60 * 60 * 1000;

/**
 * How many Claude or YouTube calls one visitor (by IP) gets per hour, by what they're for. Only
 * calls that miss the cache count, so looking at a workout someone already broke down is free.
 */
export const RATE_LIMITS = {
  /** Breaking down a workout: one call per workout, so 5 workouts. */
  parse: 5,
  /**
   * Planning a class: the warm-up, an article search per part and any board redraw, two to five
   * calls per class, so about 3 classes.
   */
  plan: 15,
  /** Looking things up: videos and points of performance, a call per movement. */
  lookup: 50,
} as const;

export type RateLimitKind = keyof typeof RATE_LIMITS;

const limiters = new Map<RateLimitKind, Ratelimit>();
/** Counts per visitor when there's no Redis (one server's worth only, so best effort). */
const counts = new Map<string, { count: number; resetAt: number }>();

/**
 * Counts a call that's about to reach Claude or YouTube, and answers 429 with a user-facing
 * message once the visitor is over their hourly limit; null while they're within it. Shared
 * across server instances with Redis, per instance without.
 */
export async function rateLimit(request: Request, kind: RateLimitKind): Promise<Response | null> {
  const visitor = visitorOf(request);
  const { success, reset } = await check(kind, visitor);
  if (success) return null;
  const minutes = Math.max(1, Math.ceil((reset - Date.now()) / 60000));
  return Response.json(
    {
      error: `That's a lot of workouts in a short time. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    },
    { status: 429, headers: { "Retry-After": String(minutes * 60) } },
  );
}

async function check(kind: RateLimitKind, visitor: string) {
  const redis = getRedis();
  if (redis) {
    let limiter = limiters.get(kind);
    if (!limiter) {
      limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(RATE_LIMITS[kind], "1 h"),
        prefix: `ratelimit:${kind}`,
      });
      limiters.set(kind, limiter);
    }
    try {
      return await limiter.limit(visitor);
    } catch (err) {
      // A limit that can't be checked lets the call through rather than breaking the app.
      console.warn("Couldn't check the rate limit:", err);
      return { success: true, reset: 0 };
    }
  }

  const key = `${kind}:${visitor}`;
  const now = Date.now();
  const entry = counts.get(key);
  if (!entry || entry.resetAt <= now) {
    counts.set(key, { count: 1, resetAt: now + HOUR_MS });
    return { success: true, reset: now + HOUR_MS };
  }
  entry.count += 1;
  return { success: entry.count <= RATE_LIMITS[kind], reset: entry.resetAt };
}

/** The visitor's IP, as the host passes it on (Netlify, Vercel, or any proxy). */
function visitorOf(request: Request) {
  const headers = request.headers;
  return (
    headers.get("x-nf-client-connection-ip") ||
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown"
  );
}

/** Forgets every count and limiter, so tests start fresh. */
export function resetRateLimits() {
  limiters.clear();
  counts.clear();
}
