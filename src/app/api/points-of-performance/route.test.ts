import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  generatePoints: vi.fn(),
  getCachedPoints: vi.fn(),
  cachePoints: vi.fn(),
}));

vi.mock("@/server/pointsOfPerformance", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/pointsOfPerformance")>()),
  ...mocks,
}));

const { mockLoad, isMockLoad } = vi.hoisted(() => ({
  mockLoad: vi.fn(async () => {}),
  isMockLoad: vi.fn(() => false),
}));
vi.mock("@/server/mockLoad", () => ({ mockLoad, isMockLoad }));

import { POST } from "./route";
import { UnusableResultError } from "@/server/apiErrors";
import { MAX_MOVEMENT_NAME_LENGTH } from "@/constants/wod";

const points = { cues: ["a", "b", "c"], faults: [{ fault: "x", fix: "y", cue: "z!" }] };

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/points-of-performance", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/points-of-performance", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    mocks.generatePoints.mockReset();
    mocks.getCachedPoints.mockReset().mockResolvedValue(null);
    mocks.cachePoints.mockReset().mockResolvedValue(undefined);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns curated points without calling Claude, even without an API key", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const res = await post({ name: "Thrusters" });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.source).toBe("curated");
    expect(data.points.cues.length).toBeGreaterThan(0);
    expect(mocks.generatePoints).not.toHaveBeenCalled();
  });

  it("returns cached AI points", async () => {
    mocks.getCachedPoints.mockResolvedValue(points);
    const res = await post({ name: "Ring Muscle-up" });

    expect(res.headers.get("X-Cache")).toBe("HIT");
    expect(await res.json()).toEqual({ points, source: "ai" });
    expect(mocks.generatePoints).not.toHaveBeenCalled();
  });

  it("waits like a real lookup for curated and cached points when MOCK_LOAD is on", async () => {
    mockLoad.mockClear();
    await post({ name: "Thrusters" });
    mocks.getCachedPoints.mockResolvedValue(points);
    await post({ name: "Ring Muscle-up" });
    expect(mockLoad.mock.calls).toEqual([["points"], ["points"]]);

    mockLoad.mockClear();
    mocks.getCachedPoints.mockResolvedValue(null);
    mocks.generatePoints.mockResolvedValue(points);
    await post({ name: "Ring Muscle-up" });
    expect(mockLoad).not.toHaveBeenCalled();
  });

  it("generates and caches points for an unknown movement", async () => {
    mocks.generatePoints.mockResolvedValue(points);
    const res = await post({ name: " Ring Muscle-up " });

    expect(res.headers.get("X-Cache")).toBe("MISS");
    expect(await res.json()).toEqual({ points, source: "ai" });
    expect(mocks.generatePoints).toHaveBeenCalledWith("Ring Muscle-up");
    expect(mocks.cachePoints).toHaveBeenCalledWith("Ring Muscle-up", points);
  });

  it("needs an API key for unknown movements", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const res = await post({ name: "Ring Muscle-up" });
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/ANTHROPIC_API_KEY/);
  });

  it.each([
    ["a missing name", {}, "Which movement?"],
    ["an empty name", { name: "  " }, "Which movement?"],
    ["a name that's too long", { name: "x".repeat(MAX_MOVEMENT_NAME_LENGTH + 1) }, /too long/],
  ])("rejects %s", async (_label, body, error) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(error);
  });

  it("returns 422 with the message when the result is unusable", async () => {
    mocks.generatePoints.mockRejectedValue(new UnusableResultError("Not a movement."));
    const res = await post({ name: "banana" });

    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: "Not a movement." });
    expect(mocks.cachePoints).not.toHaveBeenCalled();
  });

  it("returns a generic 500 for unexpected errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.generatePoints.mockRejectedValue(new Error("boom"));
    const res = await post({ name: "Ring Muscle-up" });
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Something went wrong looking up this movement.");
  });
});
