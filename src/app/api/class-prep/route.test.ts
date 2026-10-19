import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  planPrep: vi.fn(),
  getCachedPrep: vi.fn(),
  cachePrep: vi.fn(),
}));

vi.mock("@/server/classPrep", () => mocks);
const { mockLoad, isMockLoad } = vi.hoisted(() => ({
  mockLoad: vi.fn(async () => {}),
  isMockLoad: vi.fn(() => false),
}));
vi.mock("@/server/mockLoad", () => ({ mockLoad, isMockLoad }));

import { POST } from "./route";
import { UnusableResultError } from "@/server/apiErrors";
import { classPrep } from "@/test/fixtures";

const part = {
  label: null,
  title: "Fran",
  format: "for_time",
  rounds: "21-15-9",
  duration: null,
  minutes: 10,
  movements: [{ name: "Pull-up", reps: "21-15-9", load: null, category: "gymnastics" }],
  stimulus: "Sprint.",
  intensity: 9,
};

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/class-prep", { method: "POST", body: JSON.stringify(body) }),
  );
}

describe("POST /api/class-prep", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "key");
    mocks.planPrep.mockReset();
    mocks.getCachedPrep.mockReset().mockResolvedValue(null);
    mocks.cachePrep.mockReset().mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("plans, caches and returns the warm-up and skills", async () => {
    mocks.planPrep.mockResolvedValue(classPrep);
    const res = await post({ parts: [part] });

    expect(res.status).toBe(200);
    expect(res.headers.get("X-Cache")).toBe("MISS");
    await expect(res.json()).resolves.toEqual({ prep: classPrep });
    expect(mocks.planPrep).toHaveBeenCalledWith({ parts: [part] });
    expect(mocks.cachePrep).toHaveBeenCalledWith({ parts: [part] }, classPrep);
  });

  it("waits like a real plan on a cache hit when MOCK_LOAD is on, and not otherwise", async () => {
    mocks.getCachedPrep.mockResolvedValue(classPrep);
    await post({ parts: [part] });
    expect(mockLoad).toHaveBeenCalledWith("prep");

    mockLoad.mockClear();
    mocks.getCachedPrep.mockResolvedValue(null);
    mocks.planPrep.mockResolvedValue(classPrep);
    await post({ parts: [part] });
    expect(mockLoad).not.toHaveBeenCalled();
  });

  it("returns a cached plan without asking Claude", async () => {
    mocks.getCachedPrep.mockResolvedValue(classPrep);
    const res = await post({ parts: [part] });
    expect(res.headers.get("X-Cache")).toBe("HIT");
    expect(mocks.planPrep).not.toHaveBeenCalled();
  });

  it.each([
    ["no parts", { parts: [] }],
    [
      "an unknown category",
      { parts: [{ ...part, movements: [{ ...part.movements[0], category: "x" }] }] },
    ],
    ["an intensity over 10", { parts: [{ ...part, intensity: 11 }] }],
    ["nothing", null],
  ])("rejects %s", async (_, body) => {
    expect((await post(body)).status).toBe(400);
  });

  it("asks for an API key when it's missing", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect((await post({ parts: [part] })).status).toBe(500);
  });

  it("passes on a clear error and doesn't cache it", async () => {
    mocks.planPrep.mockRejectedValue(new UnusableResultError("Couldn't read the plan."));
    const res = await post({ parts: [part] });
    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toEqual({ error: "Couldn't read the plan." });
    expect(mocks.cachePrep).not.toHaveBeenCalled();
  });
});
