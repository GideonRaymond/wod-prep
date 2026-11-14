import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MOCK_DELAYS_MS, PACED_DELAYS_MS, isMockLoad, mockDelayMs, mockLoad } from "./mockLoad";

describe("mockLoad", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubEnv("CACHE_PACING", "");
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("is on only with MOCK_LOAD=true", () => {
    expect(isMockLoad()).toBe(false);
    vi.stubEnv("MOCK_LOAD", "1");
    expect(isMockLoad()).toBe(false);
    vi.stubEnv("MOCK_LOAD", "true");
    expect(isMockLoad()).toBe(true);
  });

  it("paces cached results briefly by default", () => {
    expect(mockDelayMs("articles", () => 0)).toBe(PACED_DELAYS_MS.articles[0]);
    expect(mockDelayMs("articles", () => 1)).toBe(PACED_DELAYS_MS.articles[1]);
  });

  it("picks a realistic delay within each kind's usual range with MOCK_LOAD=true", () => {
    vi.stubEnv("MOCK_LOAD", "true");
    expect(mockDelayMs("articles", () => 0)).toBe(MOCK_DELAYS_MS.articles[0]);
    expect(mockDelayMs("articles", () => 1)).toBe(MOCK_DELAYS_MS.articles[1]);
    expect(mockDelayMs("videos", () => 0.5)).toBe(
      (MOCK_DELAYS_MS.videos[0] + MOCK_DELAYS_MS.videos[1]) / 2,
    );
  });

  it("doesn't wait at all with CACHE_PACING=off", () => {
    vi.stubEnv("CACHE_PACING", "off");
    expect(mockDelayMs("articles", () => 1)).toBe(0);
  });

  it("keeps the order real results come in: the outline first, articles last", () => {
    for (const delays of [MOCK_DELAYS_MS, PACED_DELAYS_MS]) {
      for (const [kind, [min, max]] of Object.entries(delays)) {
        expect(min).toBeLessThanOrEqual(max);
        if (kind !== "articles") expect(min).toBeLessThan(delays.articles[0]);
      }
      expect(delays.outline[1]).toBeLessThanOrEqual(delays.part[1]);
    }
  });

  it("is quicker paced than mocked", () => {
    for (const [kind, [, max]] of Object.entries(PACED_DELAYS_MS)) {
      expect(max).toBeLessThan(MOCK_DELAYS_MS[kind as keyof typeof MOCK_DELAYS_MS][1]);
    }
  });

  it("waits the delay, or not at all when pacing is off", async () => {
    vi.stubEnv("CACHE_PACING", "off");
    const off = vi.fn();
    void mockLoad("videos").then(off);
    await vi.advanceTimersByTimeAsync(0);
    expect(off).toHaveBeenCalled();

    vi.stubEnv("CACHE_PACING", "");
    vi.stubEnv("MOCK_LOAD", "true");
    const on = vi.fn();
    void mockLoad("videos").then(on);
    await vi.advanceTimersByTimeAsync(MOCK_DELAYS_MS.videos[0] - 1);
    expect(on).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(MOCK_DELAYS_MS.videos[1]);
    expect(on).toHaveBeenCalled();
  });
});
