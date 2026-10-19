import { describe, expect, it } from "vitest";
import { STRETCHES } from "@/data/stretches";
import { STRETCHES_PER_CLASS, movementAreas, suggestStretches } from "./suggestStretches";

const m = (name: string, category = "other" as const) => ({ name, category });
const fran = [m("Thruster"), m("Pull-up")];

describe("movementAreas", () => {
  it.each([
    ["Thruster", "quads"],
    ["Overhead Squat", "lats"],
    ["Back Squat", "adductors"],
    ["Ring Row", "lats"],
    ["Row", "hamstrings"],
    ["Toes-to-Bar", "hip flexors"],
    ["Handstand Push-up", "triceps"],
    ["Push Press", "shoulders"],
    ["Double-Under", "calves"],
    ["Hang Power Clean", "hamstrings"],
  ])("knows %s works the %s", (name, area) => {
    expect(movementAreas(m(name))).toContain(area);
  });

  it("matches the specific movement before the general one", () => {
    expect(movementAreas(m("Thruster"))).not.toContain("adductors");
    expect(movementAreas(m("Ring Row"))).not.toContain("hamstrings");
  });

  it("falls back on the category", () => {
    expect(movementAreas({ name: "Zercher Hold", category: "weightlifting" })).toEqual([
      "hamstrings",
      "glutes",
      "lower back",
    ]);
  });
});

describe("suggestStretches", () => {
  it("covers the areas the workout works, without stretching one twice", () => {
    const stretches = suggestStretches(fran, "fran", 5);
    expect(stretches.length).toBeGreaterThanOrEqual(3);
    const areas = stretches.flatMap((s) => s.areas);
    for (const area of ["quads", "glutes", "shoulders", "lats"]) expect(areas).toContain(area);
    expect(new Set(stretches).size).toBe(stretches.length);
  });

  it(`suggests ${STRETCHES_PER_CLASS} by default`, () => {
    expect(suggestStretches(fran, "fran")).toHaveLength(STRETCHES_PER_CLASS);
  });

  it("starts with the area the movements share most", () => {
    const [first] = suggestStretches([m("Back Squat"), m("Lunge"), m("Pull-up")], "x");
    expect(first.areas).toContain("quads");
  });

  it("keeps the same picks for the same workout", () => {
    expect(suggestStretches(fran, "fran")).toEqual(suggestStretches(fran, "fran"));
  });

  it("varies the picks between workouts with the same movements", () => {
    const squats = [m("Back Squat")];
    const firsts = new Set(
      Array.from({ length: 20 }, (_, i) => suggestStretches(squats, `squats ${i}`)[0].name),
    );
    expect(firsts.size).toBeGreaterThan(1);
  });

  it("stops at the count", () => {
    const busy = [m("Snatch"), m("Burpee"), m("Run"), m("Toes-to-Bar"), m("Farmer Carry")];
    expect(suggestStretches(busy, "x", 3)).toHaveLength(3);
  });

  it("suggests nothing without movements", () => {
    expect(suggestStretches([], "x")).toEqual([]);
  });

  it("only suggests stretches from the library", () => {
    for (const stretch of suggestStretches(fran, "fran")) expect(STRETCHES).toContain(stretch);
  });
});
