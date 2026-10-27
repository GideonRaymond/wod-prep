import "server-only";
import { Redis } from "@upstash/redis";

let client: Redis | null | undefined;

/**
 * The Upstash Redis database for the shared cache and rate limits, or null when none is set up
 * (local development falls back to files and in-memory counts). Reads UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN, or the KV_REST_API_* names that Vercel's integration sets.
 */
export function getRedis(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;
  return client;
}

/** Forgets the client, so tests can change the environment. */
export function resetRedis() {
  client = undefined;
}
