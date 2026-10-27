import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const upstash = vi.hoisted(() => ({ limit: vi.fn(), options: [] as unknown[] }));
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: Object.assign(
    class {
      constructor(options: unknown) {
        upstash.options.push(options);
      }
      limit = upstash.limit;
    },
    { slidingWindow: (requests: number, window: string) => ({ requests, window }) },
  ),
}));
vi.mock("@upstash/redis", () => ({ Redis: class {} }));

import { RATE_LIMITS, rateLimit, resetRateLimits } from "./rateLimit";
import { resetRedis } from "./redis";

const from = (ip: string, header = "x-forwarded-for") =>
  new Request("http://localhost/api/parse", { method: "POST", headers: { [header]: ip } });

describe("rateLimit", () => {
  beforeEach(() => {
    resetRateLimits();
    resetRedis();
    upstash.limit.mockReset();
    upstash.options = [];
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
    vi.restoreAllMocks();
    resetRedis();
  });

  it("allows 5 workouts, about 3 classes and 50 lookups an hour", () => {
    expect(RATE_LIMITS).toEqual({ parse: 5, plan: 15, lookup: 50 });
  });

  describe("without Redis", () => {
    it("lets a visitor through up to their hourly limit, then answers 429", async () => {
      for (let i = 0; i < RATE_LIMITS.parse; i++) {
        expect(await rateLimit(from("1.1.1.1"), "parse")).toBeNull();
      }
      const res = await rateLimit(from("1.1.1.1"), "parse");
      expect(res!.status).toBe(429);
      expect(res!.headers.get("Retry-After")).toBe("3600");
      await expect(res!.json()).resolves.toEqual({
        error: "That's a lot of workouts in a short time. Try again in 60 minutes.",
      });
    });

    it("counts each visitor and each kind on its own", async () => {
      for (let i = 0; i < RATE_LIMITS.parse; i++) await rateLimit(from("1.1.1.1"), "parse");
      expect(await rateLimit(from("2.2.2.2"), "parse")).toBeNull();
      expect(await rateLimit(from("1.1.1.1"), "plan")).toBeNull();
    });

    it("starts counting again after the hour", async () => {
      vi.useFakeTimers();
      for (let i = 0; i <= RATE_LIMITS.parse; i++) await rateLimit(from("1.1.1.1"), "parse");
      vi.advanceTimersByTime(60 * 60 * 1000);
      expect(await rateLimit(from("1.1.1.1"), "parse")).toBeNull();
    });

    it("knows the visitor by the IP Netlify or Vercel pass on, before X-Forwarded-For", async () => {
      for (let i = 0; i < RATE_LIMITS.parse; i++) {
        await rateLimit(from("1.1.1.1", "x-nf-client-connection-ip"), "parse");
      }
      expect(await rateLimit(from("1.1.1.1, 9.9.9.9"), "parse")).not.toBeNull();
      expect(await rateLimit(from("3.3.3.3", "x-real-ip"), "parse")).toBeNull();
    });
  });

  describe("with Redis", () => {
    beforeEach(() => {
      vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
      vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    });

    it("uses a sliding hourly window per kind, shared across servers", async () => {
      upstash.limit.mockResolvedValue({ success: true, reset: Date.now() + 1000 });
      expect(await rateLimit(from("1.1.1.1"), "plan")).toBeNull();
      expect(upstash.limit).toHaveBeenCalledWith("1.1.1.1");
      expect(upstash.options[0]).toMatchObject({
        limiter: { requests: RATE_LIMITS.plan, window: "1 h" },
        prefix: "ratelimit:plan",
      });
    });

    it("answers 429 when Redis says the visitor is over", async () => {
      upstash.limit.mockResolvedValue({ success: false, reset: Date.now() + 90 * 1000 });
      const res = await rateLimit(from("1.1.1.1"), "plan");
      expect(res!.status).toBe(429);
      await expect(res!.json()).resolves.toEqual({
        error: "That's a lot of workouts in a short time. Try again in 2 minutes.",
      });
    });

    it("lets the call through when the limit can't be checked", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      upstash.limit.mockRejectedValue(new Error("down"));
      expect(await rateLimit(from("1.1.1.1"), "plan")).toBeNull();
    });
  });
});
