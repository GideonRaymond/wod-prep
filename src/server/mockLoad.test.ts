import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MOCK_DELAYS_MS, isMockLoad, mockDelayMs, mockLoad } from "./mockLoad";

describe("mockLoad", () => {
  beforeEach(() => {
    vi.useFakeTimers();
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

  it("picks a delay within each kind's usual range", () => {
    expect(mockDelayMs("articles", () => 0)).toBe(MOCK_DELAYS_MS.articles[0]);
    expect(mockDelayMs("articles", () => 1)).toBe(MOCK_DELAYS_MS.articles[1]);
    expect(mockDelayMs("videos", () => 0.5)).toBe(
      (MOCK_DELAYS_MS.videos[0] + MOCK_DELAYS_MS.videos[1]) / 2,
    );
  });

  it("makes articles take longest, as they do for real", () => {
    for (const [kind, [min]] of Object.entries(MOCK_DELAYS_MS)) {
      if (kind !== "articles") expect(min).toBeLessThan(MOCK_DELAYS_MS.articles[0]);
    }
  });

  it("waits only when on", async () => {
    const off = vi.fn();
    void mockLoad("videos").then(off);
    await vi.advanceTimersByTimeAsync(0);
    expect(off).toHaveBeenCalled();

    vi.stubEnv("MOCK_LOAD", "true");
    const on = vi.fn();
    void mockLoad("videos").then(on);
    await vi.advanceTimersByTimeAsync(MOCK_DELAYS_MS.videos[0] - 1);
    expect(on).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(MOCK_DELAYS_MS.videos[1]);
    expect(on).toHaveBeenCalled();
  });
});
