import "server-only";
import type { z } from "zod";
import { createFileCache } from "./fileCache";
import { getRedis } from "./redis";

/** How long a result stays in the shared cache; entries with their own max age check it too. */
export const CACHE_TTL_SECONDS = 90 * 24 * 60 * 60;

export type Cache<T> = {
  get: (key: string) => Promise<T | null>;
  set: (key: string, value: T) => Promise<void>;
  setIfMissing: (key: string, value: T) => Promise<void>;
};

/**
 * A cache of Claude and YouTube results, so the same workout (or movement) isn't asked about
 * twice. In production it's the shared Redis database (see getRedis); without one, it's the
 * JSON files in `.cache/` that development uses (see createFileCache). WOD_CACHE=off turns both off.
 *
 * Entries are checked against the schema when read, so stale or corrupt ones count as a miss, and
 * a Redis error is logged and treated as a miss too: the cache never breaks a request.
 */
export function createCache<T>(name: string, schema: z.ZodType<T>): Cache<T> {
  const files = createFileCache(name, schema);
  const redisKey = (key: string) => `cache:${name}:${key}`;
  const redis = () => (process.env.WOD_CACHE === "off" ? null : getRedis());

  async function write(key: string, value: T, onlyIfMissing: boolean) {
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
    async get(key) {
      const client = redis();
      if (!client) return files.get(key);
      try {
        const parsed = schema.safeParse(await client.get(redisKey(key)));
        return parsed.success ? parsed.data : null;
      } catch (err) {
        console.warn(`Couldn't read the ${name} cache:`, err);
        return null;
      }
    },
    set: (key, value) => write(key, value, false),
    setIfMissing: (key, value) => write(key, value, true),
  };
}
