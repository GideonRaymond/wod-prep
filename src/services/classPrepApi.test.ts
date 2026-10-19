import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prepKey, requestClassPrep, toPrepRequest } from "./classPrepApi";
import { classPrep, strengthAndMetcon } from "@/test/fixtures";
import { toWodState } from "@/utils/toWodState";

const fetchMock = vi.fn();
const wod = toWodState(strengthAndMetcon);

describe("toPrepRequest", () => {
  it("keeps what the planner needs from each part", () => {
    const [squats] = toPrepRequest(wod).parts;
    expect(squats).toEqual({
      label: "A",
      title: "Heavy Back Squats",
      format: wod.parts[0].format,
      rounds: wod.parts[0].rounds,
      duration: wod.parts[0].duration,
      minutes: 15,
      movements: [{ name: "Back Squat", reps: "5x5", load: null, category: "weightlifting" }],
      stimulus: wod.parts[0].stimulus.description,
      intensity: wod.parts[0].stimulus.intensity,
    });
  });

  it("sends an unknown length for workouts saved before lengths were parsed", () => {
    const old = { parts: [{ ...wod.parts[0], minutes: undefined }] };
    expect(toPrepRequest(old).parts[0].minutes).toBeNull();
  });
});

describe("prepKey", () => {
  it("ignores videos, articles and an earlier plan, but not edits", () => {
    const withExtras = {
      parts: wod.parts.map((p) => ({ ...p, articles: [], videos: [] })),
      prep: { key: "old", plan: classPrep },
    };
    expect(prepKey(withExtras)).toBe(prepKey(wod));
    const edited = { parts: [{ ...wod.parts[0], movements: [] }, ...wod.parts.slice(1)] };
    expect(prepKey(edited)).not.toBe(prepKey(wod));
  });
});

describe("requestClassPrep", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the workout and returns the plan", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ prep: classPrep }) });
    await expect(requestClassPrep(wod)).resolves.toEqual(classPrep);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/class-prep");
    expect(JSON.parse(init.body)).toEqual(toPrepRequest(wod));
  });

  it("throws the server's error message", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: "Rate limited." }) });
    await expect(requestClassPrep(wod)).rejects.toThrow("Rate limited.");
  });
});
