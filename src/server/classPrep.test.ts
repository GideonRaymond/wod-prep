import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockParse } = vi.hoisted(() => ({ mockParse: vi.fn() }));
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    beta = { messages: { parse: mockParse } };
  },
}));

import { PREP_MAX_AGE_MS, cachePrep, getCachedPrep, planPrep, prepCacheKey } from "./classPrep";
import { UnusableResultError } from "./apiErrors";
import type { PrepRequest } from "@/schemas/classPrep";
import { classPrep } from "@/test/fixtures";

const ropeAmrap: PrepRequest["parts"][number] = {
  label: null,
  title: "Rope and Toes",
  format: "amrap",
  rounds: null,
  duration: "14 min AMRAP",
  minutes: 14,
  movements: [
    { name: "Rope Climb", reps: "2", load: null, category: "gymnastics" },
    { name: "Toes-to-Bar", reps: "10", load: null, category: "gymnastics" },
  ],
  stimulus: "Steady and hard.",
  intensity: 7,
};
const request: PrepRequest = { parts: [ropeAmrap] };

const answer = (prep: object) => ({ stop_reason: "end_turn", parsed_output: prep });
const sent = () => JSON.parse(mockParse.mock.calls[0][0].messages[0].content);

describe("planPrep", () => {
  beforeEach(() => {
    mockParse.mockReset();
  });

  it("returns Claude's plan when it fits", async () => {
    mockParse.mockResolvedValue(answer(classPrep));
    await expect(planPrep(request)).resolves.toEqual(classPrep);
  });

  it("sends the parts with their stage and the minutes left for warm-up and skills", async () => {
    mockParse.mockResolvedValue(answer(classPrep));
    await planPrep({ parts: [ropeAmrap, { ...ropeAmrap, label: "Cool-down", minutes: 5 }] });

    const params = mockParse.mock.calls[0][0];
    expect(params.model).toBe("claude-opus-5-5");
    expect(params.output_config.format).toBeDefined();
    expect(params.system).toContain("12 athletes");
    expect(params.system).toContain("Dynamic stretching");
    // 60 - 5 whiteboard - 14 - 5 cool-down
    expect(sent()).toMatchObject({ minutesForWarmupAndSkills: 36, programmedWarmup: false });
    expect(sent().parts.map((p: { stage: string }) => p.stage)).toEqual(["part", "cooldown"]);
  });

  it("says when the time left is unknown, or there's none", async () => {
    mockParse.mockResolvedValue(answer(classPrep));
    await planPrep({ parts: [{ ...ropeAmrap, minutes: null }] });
    expect(sent().minutesForWarmupAndSkills).toBe("unknown");

    mockParse.mockClear();
    await planPrep({ parts: [{ ...ropeAmrap, minutes: 60 }] });
    expect(sent().minutesForWarmupAndSkills).toBe(0);
  });

  it("drops a planned warm-up when one is programmed", async () => {
    mockParse.mockResolvedValue(answer(classPrep));
    const warmup = { ...ropeAmrap, label: "Warm-up", minutes: 10 };
    const prep = await planPrep({ parts: [warmup, ropeAmrap] });
    expect(sent().programmedWarmup).toBe(true);
    expect(prep.warmup).toBeNull();
  });

  it("trims skill practice that doesn't fit the class", async () => {
    mockParse.mockResolvedValue(answer(classPrep));
    // 60 - 5 - 36 - 5 = 14 left: the 10 min warm-up stays, the 11 min pull-up practice can't fit.
    const prep = await planPrep({ parts: [{ ...ropeAmrap, minutes: 36 }] });
    expect(prep).toEqual({ warmup: classPrep.warmup, skills: [] });
  });

  it("throws a clear error when Claude declines or the plan can't be read", async () => {
    mockParse.mockResolvedValue({ stop_reason: "refusal", parsed_output: null });
    await expect(planPrep(request)).rejects.toThrow("declined");
    mockParse.mockResolvedValue({ stop_reason: "end_turn", parsed_output: null });
    await expect(planPrep(request)).rejects.toBeInstanceOf(UnusableResultError);
  });
});

describe("prepCacheKey", () => {
  it("ignores titles and the stimulus text", () => {
    const renamed = { ...ropeAmrap, title: "Climb Time", stimulus: "Other words." };
    expect(prepCacheKey({ parts: [renamed] })).toBe(prepCacheKey(request));
  });

  it("changes with the movements or the part's length", () => {
    expect(prepCacheKey({ parts: [{ ...ropeAmrap, minutes: 20 }] })).not.toBe(
      prepCacheKey(request),
    );
    expect(
      prepCacheKey({ parts: [{ ...ropeAmrap, movements: ropeAmrap.movements.slice(1) }] }),
    ).not.toBe(prepCacheKey(request));
  });
});

describe("class prep cache", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "class-prep-cache-"));
    vi.stubEnv("WOD_CACHE", "on");
    vi.stubEnv("WOD_CACHE_DIR", dir);
  });
  afterEach(async () => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    await rm(dir, { recursive: true, force: true });
  });

  it("keeps a plan for a month, then plans again", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-01T12:00:00Z"));
    await cachePrep(request, classPrep);

    vi.setSystemTime(Date.now() + PREP_MAX_AGE_MS);
    await expect(getCachedPrep(request)).resolves.toEqual(classPrep);

    vi.setSystemTime(Date.now() + 1);
    await expect(getCachedPrep(request)).resolves.toBeNull();
  });
});
