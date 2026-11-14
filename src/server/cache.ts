import "server-only";
import type { z } from "zod";
import EXAMPLE_CACHE from "@/data/exampleCache.json";
import { createFileCache } from "./fileCache";
import { getRedis } from "./redis";

/** How long a result stays in the shared cache; entries with their own max age check it too. */
export const CACHE_TTL_SECONDS = 90 * 24 * 60 * 60;

export type Cache<T> = {
  get: (key: string) => Promise<T | null>;
  set: (key: string, value: T) => Promise<void>;
  setIfMissing: (key: string, value: T) => Promise<void>;
};

/** Entries by key, as one cache holds them. */
export type CacheEntries = Record<string, unknown>;

/** Every result the example workout needs, by cache name (see seedExample.ts). */
const EXAMPLE_ENTRIES: Record<string, CacheEntries> = EXAMPLE_CACHE;

let recording: Record<string, CacheEntries> | null = null;

/**
 * Notes every entry read or written from now on into `into`, by cache name and key, until
 * stopped with null. The example's seed is made this way (see seedExample.ts).
 */
export function recordCache(into: Record<string, CacheEntries> | null) {
  recording = into;
}

/**
 * A result kept in the repository is always fresh: one with a `savedAt` time gets now, so the
 * month-long limits on videos, articles and plans never expire it.
 */
function fresh<T>(value: T): T {
  if (value && typeof value === "object" && "savedAt" in value) {
    return { ...value, savedAt: Date.now() };
  }
  return value;
}

/**
 * A cache of Claude and YouTube results, so the same workout (or movement) isn't asked about
 * twice. In production it's the shared Redis database (see getRedis); without one, it's the
 * JSON files in `.cache/` that development uses (see createFileCache). WOD_CACHE=off turns both off.
 *
 * Entries are checked against the schema when read, so stale or corrupt ones count as a miss, and
 * a Redis error is logged and treated as a miss too: the cache never breaks a request.
 *
 * Before any of that, it looks in `seed`: by default the example workout's results, kept in the
 * repository (src/data/exampleCache.json), so trying the example always works without a login,
 * whatever has expired from Redis, and even with WOD_CACHE=off.
 */
export function createCache<T>(
  name: string,
  schema: z.ZodType<T>,
  seed: CacheEntries = EXAMPLE_ENTRIES[name] ?? {},
): Cache<T> {
  const files = createFileCache(name, schema);
  const redisKey = (key: string) => `cache:${name}:${key}`;
  const redis = () => (process.env.WOD_CACHE === "off" ? null : getRedis());

  const record = (key: string, value: T | null) => {
    if (recording && value !== null) (recording[name] ??= {})[key] = value;
    return value;
  };

  async function lookUp(key: string): Promise<T | null> {
    if (Object.hasOwn(seed, key)) {
      const parsed = schema.safeParse(seed[key]);
      if (parsed.success) return fresh(parsed.data);
    }
    const client = redis();
    if (!client) return files.get(key);
    try {
      const parsed = schema.safeParse(await client.get(redisKey(key)));
      return parsed.success ? parsed.data : null;
    } catch (err) {
      console.warn(`Couldn't read the ${name} cache:`, err);
      return null;
    }
  }

  async function write(key: string, value: T, onlyIfMissing: boolean) {
    record(key, value);
    const client = redis();
    if (!client) return onlyIfMissing ? files.setIfMissing(key, value) : files.set(key, value);
    try {
      await client.set(
        redisKey(key),
        value,
        onlyIfMissing ? { ex: CACHE_TTL_SECONDS, nx: true } : { ex: CACHE_TTL_SECONDS },
      );
    } catch (err) {
      console.warn(`Couldn't write the ${name} cache:`, err);
    }
  }

  return {
    get: async (key) => record(key, await lookUp(key)),
    set: (key, value) => write(key, value, false),
    setIfMissing: (key, value) => write(key, value, true),
  };
}
