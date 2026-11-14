import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lookUpExample } from "./seedExample";
import { resetRedis } from "./redis";

describe("the example workout's seed", () => {
  beforeEach(() => {
    // Only what's in the repository: no Redis, no .cache files.
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("KV_REST_API_URL", "");
    vi.stubEnv("WOD_CACHE", "off");
    resetRedis();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    resetRedis();
  });

  it("holds everything the example's class needs, so it never needs a login", async () => {
    // When this fails after a cache version bump, run `npm run seed:example` and commit the seed.
    await expect(lookUpExample()).resolves.toEqual([]);
  });
});
