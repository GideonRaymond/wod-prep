import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { z } from "zod";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const redis = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));
vi.mock("@upstash/redis", () => ({
  Redis: class {
    get = redis.get;
    set = redis.set;
  },
}));

import { CACHE_TTL_SECONDS, createCache, recordCache, type CacheEntries } from "./cache";
import { resetRedis } from "./redis";

const Schema = z.object({ n: z.number() });
const cache = createCache("things", Schema);

describe("createCache", () => {
  beforeEach(() => {
    redis.get.mockReset();
    redis.set.mockReset().mockResolvedValue("OK");
    resetRedis();
    vi.stubEnv("WOD_CACHE", "");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    resetRedis();
  });

  describe("with Redis", () => {
    beforeEach(() => {
      vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
      vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    });

    it("stores entries under the cache's name, for 90 days", async () => {
      await cache.set("a", { n: 1 });
      expect(redis.set).toHaveBeenCalledWith("cache:things:a", { n: 1 }, { ex: CACHE_TTL_SECONDS });
      expect(CACHE_TTL_SECONDS).toBe(90 * 24 * 60 * 60);
    });

    it("only stores with setIfMissing when there's nothing there yet", async () => {
      await cache.setIfMissing("a", { n: 2 });
      expect(redis.set).toHaveBeenCalledWith(
        "cache:things:a",
        { n: 2 },
        { ex: CACHE_TTL_SECONDS, nx: true },
      );
    });

    it("reads entries, treating ones that don't match the schema as a miss", async () => {
      redis.get.mockResolvedValueOnce({ n: 1 }).mockResolvedValueOnce({ n: "x" });
      await expect(cache.get("a")).resolves.toEqual({ n: 1 });
      await expect(cache.get("b")).resolves.toBeNull();
      expect(redis.get).toHaveBeenCalledWith("cache:things:a");
    });

    it("treats a Redis error as a miss, and never throws", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      redis.get.mockRejectedValue(new Error("down"));
      redis.set.mockRejectedValue(new Error("down"));
      await expect(cache.get("a")).resolves.toBeNull();
      await expect(cache.set("a", { n: 1 })).resolves.toBeUndefined();
      expect(warn).toHaveBeenCalledTimes(2);
    });

    it("also takes Vercel's KV_REST_API names", async () => {
      vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
      vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
      vi.stubEnv("KV_REST_API_URL", "https://example.upstash.io");
      vi.stubEnv("KV_REST_API_TOKEN", "token");
      resetRedis();
      await cache.set("a", { n: 1 });
      expect(redis.set).toHaveBeenCalled();
    });

    it("does nothing with WOD_CACHE=off", async () => {
      vi.stubEnv("WOD_CACHE", "off");
      await cache.set("a", { n: 1 });
      await expect(cache.get("a")).resolves.toBeNull();
      expect(redis.set).not.toHaveBeenCalled();
      expect(redis.get).not.toHaveBeenCalled();
    });
  });

  describe("without Redis", () => {
    let dir: string;
    beforeEach(async () => {
      dir = await mkdtemp(path.join(tmpdir(), "cache-"));
      vi.stubEnv("WOD_CACHE", "on");
      vi.stubEnv("WOD_CACHE_DIR", dir);
    });
    afterEach(async () => {
      await rm(dir, { recursive: true, force: true });
    });

    it("falls back to the files in .cache/", async () => {
      await cache.set("a", { n: 1 });
      await cache.setIfMissing("a", { n: 2 });
      await expect(cache.get("a")).resolves.toEqual({ n: 1 });
      expect(redis.set).not.toHaveBeenCalled();
    });
  });

  describe("seeded with the example", () => {
    const Entry = z.object({ savedAt: z.number(), n: z.number() });
    const seeded = createCache("things", Entry, { a: { savedAt: 1, n: 1 }, bad: { n: "x" } });

    beforeEach(() => {
      vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
      vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    });

    it("answers from the seed before Redis, always fresh", async () => {
      vi.spyOn(Date, "now").mockReturnValue(5000);
      await expect(seeded.get("a")).resolves.toEqual({ savedAt: 5000, n: 1 });
      expect(redis.get).not.toHaveBeenCalled();
    });

    it("still answers with WOD_CACHE=off", async () => {
      vi.stubEnv("WOD_CACHE", "off");
      await expect(seeded.get("a")).resolves.toMatchObject({ n: 1 });
    });

    it("goes on to Redis for keys it doesn't have, or that no longer match the schema", async () => {
      redis.get.mockResolvedValue({ savedAt: 2, n: 2 });
      await expect(seeded.get("bad")).resolves.toEqual({ savedAt: 2, n: 2 });
      await expect(seeded.get("toString")).resolves.toEqual({ savedAt: 2, n: 2 });
      expect(redis.get).toHaveBeenCalledWith("cache:things:bad");
    });
  });

  it("records what's read and written while recording, by cache name", async () => {
    vi.stubEnv("WOD_CACHE", "off");
    const seeded = createCache("things", Schema, { a: { n: 1 } });
    const into: Record<string, CacheEntries> = {};
    recordCache(into);
    await seeded.get("a");
    await seeded.get("missing");
    await seeded.set("b", { n: 2 });
    recordCache(null);
    await seeded.set("c", { n: 3 });
    expect(into).toEqual({ things: { a: { n: 1 }, b: { n: 2 } } });
  });
});
