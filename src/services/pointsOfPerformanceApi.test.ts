import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requestPointsOfPerformance } from "./pointsOfPerformanceApi";

const fetchMock = vi.fn();
const points = { cues: ["a"], faults: [] };

describe("requestPointsOfPerformance", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the movement name and returns points and source", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ points, source: "ai" }) });

    await expect(requestPointsOfPerformance("Thruster")).resolves.toEqual({ points, source: "ai" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/points-of-performance");
    expect(JSON.parse(init.body)).toEqual({ name: "Thruster" });
  });

  it("throws the API's error message", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: "Not a movement." }) });
    await expect(requestPointsOfPerformance("x")).rejects.toThrow("Not a movement.");
  });
});
