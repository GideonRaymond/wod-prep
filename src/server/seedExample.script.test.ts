import { writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Not a test: `npm run seed:example` runs this to remake src/data/exampleCache.json, the example
 * workout's results kept in the repository. It reuses what the .cache/ files already hold and
 * makes the rest with Claude and YouTube (keys from .env), never touching the shared Redis cache.
 * Skipped otherwise.
 */
describe.runIf(process.env.SEED_EXAMPLE === "on")("seed the example workout", () => {
  it("records everything the example needs", { timeout: 300_000 }, async () => {
    try {
      process.loadEnvFile(".env");
    } catch {
      // No .env: whatever is already cached is all there is.
    }
    process.env.WOD_CACHE = "on";
    for (const name of [
      "UPSTASH_REDIS_REST_URL",
      "UPSTASH_REDIS_REST_TOKEN",
      "KV_REST_API_URL",
      "KV_REST_API_TOKEN",
    ]) {
      delete process.env[name];
    }

    // Imported once the keys are loaded, since the Claude client reads them when it's made.
    const { recordCache } = await import("./cache");
    const { resetRedis } = await import("./redis");
    const { lookUpExample } = await import("./seedExample");
    resetRedis();

    const seed: Parameters<typeof recordCache>[0] = {};
    recordCache(seed);
    await lookUpExample({ fill: true });
    recordCache(null);
    await expect(lookUpExample()).resolves.toEqual([]);

    const file = path.join(process.cwd(), "src/data/exampleCache.json");
    await writeFile(file, `${JSON.stringify(sorted(seed!), null, 2)}\n`);
    console.log(`Wrote ${file}`);
  });
});

/** Keys in order, so the file only changes where a result did. */
function sorted(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sorted);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, sorted(v)]),
    );
  }
  return value;
}
