import { describe, expect, it } from "vitest";
import { WHITEBOARD_MINUTES, allEquipment, planClass, stageKind } from "./classPlan";
import { strengthAndMetcon } from "@/test/fixtures";
import { toWodState } from "./toWodState";

const wod = toWodState(strengthAndMetcon);

describe("stageKind", () => {
  it.each([
    ["Warm-up", "warmup"],
    ["warmup", "warmup"],
    ["Cool-down", "cooldown"],
    ["Stretching", "cooldown"],
    ["Mobility", "cooldown"],
    ["A", "part"],
    [null, "part"],
  ] as const)("treats the label %s as %s", (label, kind) => {
    expect(stageKind({ label })).toBe(kind);
  });
});

describe("planClass", () => {
  it("starts the first part after the whiteboard and the next ones back to back", () => {
    const plan = planClass(wod);
    expect(plan.map((p) => [p.part.title, p.kind, p.startsAt])).toEqual([
      ["Heavy Back Squats", "part", WHITEBOARD_MINUTES],
      ["Fran", "part", WHITEBOARD_MINUTES + 15],
      ["Easy Flush", "cooldown", WHITEBOARD_MINUTES + 15 + 12],
    ]);
  });

  it("puts a warm-up first and a cool-down last, whatever order they were written in", () => {
    const [squats, fran, cooldown] = wod.parts;
    const warmup = { ...squats, id: "w", label: "Warm-up", title: "Prep", minutes: 10 };
    const plan = planClass({ parts: [cooldown, fran, warmup] });
    expect(plan.map((p) => p.part.id)).toEqual(["w", fran.id, cooldown.id]);
    expect(plan[1].startsAt).toBe(WHITEBOARD_MINUTES + 10);
  });

  it("stops giving start times after a part with an unknown length", () => {
    const parts = [{ ...wod.parts[0], minutes: null }, wod.parts[1]];
    expect(planClass({ parts }).map((p) => p.startsAt)).toEqual([WHITEBOARD_MINUTES, null]);
  });
});

describe("allEquipment", () => {
  it("lists each item once, ignoring case, in order of first use", () => {
    expect(
      allEquipment([
        { equipment: ["Barbell", "Plates"] },
        { equipment: ["barbell", "Pull-up bar"] },
        {},
      ]),
    ).toEqual(["Barbell", "Plates", "Pull-up bar"]);
  });
});
