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

import {
  cachePoints,
  findCuratedPoints,
  generatePoints,
  getCachedPoints,
} from "./pointsOfPerformance";
import { UnusableResultError } from "./apiErrors";

const points = {
  cues: ["Grip the rings", "Pull to the chest", "Lock out"],
  faults: [{ fault: "Chicken wing", fix: "Turn both arms over together", cue: "Elbows together!" }],
};

describe("findCuratedPoints", () => {
  it.each(["Thruster", "pull ups", "T2B", "Wall-ball shot", "Air Squats", "Row (calories)"])(
    "knows %s",
    (name) => {
      expect(findCuratedPoints(name)?.cues.length).toBeGreaterThan(0);
    },
  );

  it("covers every movement in Fran and Murph", () => {
    for (const name of ["Thruster", "Pull-up", "Run", "Push-up", "Air Squat"]) {
      expect(findCuratedPoints(name)).not.toBeNull();
    }
  });

  it("returns null for movements it doesn't know", () => {
    expect(findCuratedPoints("Ring Muscle-up")).toBeNull();
  });
});

describe("generatePoints", () => {
  beforeEach(() => {
    mockParse.mockReset();
  });

  it("asks Claude about the movement and returns its answer", async () => {
    mockParse.mockResolvedValue({ stop_reason: "end_turn", parsed_output: points });

    await expect(generatePoints("Ring Muscle-up")).resolves.toEqual(points);
    const params = mockParse.mock.calls[0][0];
    expect(params.messages).toEqual([{ role: "user", content: "Ring Muscle-up" }]);
    expect(params.output_config.format).toBeDefined();
    expect(params.system).toMatch(/short verbal cue/);
  });

  it("throws a user-facing error when the model refuses", async () => {
    mockParse.mockResolvedValue({ stop_reason: "refusal", parsed_output: null });
    await expect(generatePoints("x")).rejects.toThrow(UnusableResultError);
  });

  it("throws a user-facing error when it isn't a movement", async () => {
    mockParse.mockResolvedValue({
      stop_reason: "end_turn",
      parsed_output: { cues: [], faults: [] },
    });
    await expect(generatePoints("banana")).rejects.toThrow(
      'Couldn\'t find points of performance for "banana".',
    );
  });
});

describe("points cache", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "pop-cache-"));
    vi.stubEnv("WOD_CACHE", "on");
    vi.stubEnv("WOD_CACHE_DIR", dir);
  });
  afterEach(async () => {
    vi.unstubAllEnvs();
    await rm(dir, { recursive: true, force: true });
  });

  it("stores AI results per movement, matching name variants", async () => {
    await expect(getCachedPoints("Ring Muscle-up")).resolves.toBeNull();
    await cachePoints("Ring Muscle-up", points);
    await expect(getCachedPoints("ring muscle ups")).resolves.toEqual(points);
  });
});
