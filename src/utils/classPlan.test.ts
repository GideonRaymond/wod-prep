import { describe, expect, it } from "vitest";
import {
  CLASS_MINUTES,
  WHITEBOARD_MINUTES,
  WRAP_UP_MINUTES,
  allEquipment,
  classEnd,
  fitPrep,
  isPlannedPart,
  partForSkill,
  planClass,
  prepBudget,
  skillMinutes,
  stageKind,
  type PlannedStage,
} from "./classPlan";
import type { ClassPrep, SkillBlock } from "@/schemas/classPrep";
import { classPrep, strengthAndMetcon } from "@/test/fixtures";
import { toWodState } from "./toWodState";

const wod = toWodState(strengthAndMetcon);

/** Each stage as [name, kind, start], for comparing plans. */
const outline = (plan: PlannedStage[]) =>
  plan.map((stage) => [
    isPlannedPart(stage)
      ? stage.part.title
      : stage.kind === "skill"
        ? stage.skill.movement
        : "Warm-up",
    stage.kind,
    stage.startsAt,
  ]);

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
    expect(outline(planClass(wod))).toEqual([
      ["Heavy Back Squats", "part", WHITEBOARD_MINUTES],
      ["Fran", "part", WHITEBOARD_MINUTES + 15],
      ["Easy Flush", "cooldown", WHITEBOARD_MINUTES + 15 + 12],
    ]);
  });

  it("puts a warm-up first and a cool-down last, whatever order they were written in", () => {
    const [squats, fran, cooldown] = wod.parts;
    const warmup = { ...squats, id: "w", label: "Warm-up", title: "Prep", minutes: 10 };
    const plan = planClass({ parts: [cooldown, fran, warmup] });
    expect(outline(plan).map(([name]) => name)).toEqual(["Prep", "Fran", "Easy Flush"]);
    expect(plan[1].startsAt).toBe(WHITEBOARD_MINUTES + 10);
  });

  it("stops giving start times after a part with an unknown length", () => {
    const parts = [{ ...wod.parts[0], minutes: null }, wod.parts[1]];
    expect(planClass({ parts }).map((p) => p.startsAt)).toEqual([WHITEBOARD_MINUTES, null]);
  });

  it("puts the planned warm-up first and each skill right before the part that uses it", () => {
    expect(outline(planClass(wod, classPrep))).toEqual([
      ["Warm-up", "planned-warmup", WHITEBOARD_MINUTES],
      ["Heavy Back Squats", "part", WHITEBOARD_MINUTES + 10],
      ["Pull-up", "skill", WHITEBOARD_MINUTES + 25],
      ["Fran", "part", WHITEBOARD_MINUTES + 36],
      ["Easy Flush", "cooldown", WHITEBOARD_MINUTES + 48],
    ]);
  });

  it("puts practice for a lift in B between A and B", () => {
    const [squats, fran] = wod.parts;
    const ohs = {
      ...fran,
      id: "b",
      title: "Overhead Squats",
      movements: [{ ...squats.movements[0], id: "o", name: "Overhead Squat" }],
    };
    const skill = { ...classPrep.skills[0], movement: "Overhead Squats" };
    const plan = planClass({ parts: [squats, ohs] }, { warmup: null, skills: [skill] });
    expect(outline(plan).map(([name, kind]) => `${kind}: ${name}`)).toEqual([
      "part: Heavy Back Squats",
      "skill: Overhead Squats",
      "part: Overhead Squats",
    ]);
  });

  it("puts a skill no part names before the first workout part", () => {
    const skill = { ...classPrep.skills[0], movement: "Handstand Walk" };
    const plan = planClass(wod, { warmup: null, skills: [skill] });
    expect(outline(plan).map(([name]) => name)).toEqual([
      "Handstand Walk",
      "Heavy Back Squats",
      "Fran",
      "Easy Flush",
    ]);
  });

  it("puts skill practice after a programmed warm-up", () => {
    const warmup = { ...wod.parts[0], id: "w", label: "Warm-up", title: "Prep", minutes: 10 };
    const plan = planClass(
      { parts: [warmup, wod.parts[1]] },
      { warmup: null, skills: classPrep.skills },
    );
    expect(outline(plan).map(([name]) => name)).toEqual(["Prep", "Pull-up", "Fran"]);
  });
});

describe("partForSkill", () => {
  const parts = [
    { movements: [{ name: "Back Squat" }] },
    { movements: [{ name: "Strict Toes-to-Bar" }, { name: "Overhead Squat" }] },
  ];

  it("finds the first part with the movement, under any spelling", () => {
    expect(partForSkill({ movement: "overhead squats" }, parts)).toBe(parts[1]);
  });

  it("matches a variation of the movement", () => {
    expect(partForSkill({ movement: "Toes-to-Bar" }, parts)).toBe(parts[1]);
  });

  it("is null when no part has it", () => {
    expect(partForSkill({ movement: "Rope Climb" }, parts)).toBeNull();
  });
});

describe("skillMinutes", () => {
  it("adds the setup to every progression", () => {
    expect(skillMinutes(classPrep.skills[0])).toBe(2 + 4 + 5);
  });
});

describe("prepBudget", () => {
  it("leaves what the whiteboard and the parts don't use", () => {
    // 15 min squats, 12 min Fran, 5 min cool-down.
    expect(prepBudget(wod.parts)).toBe(CLASS_MINUTES - WHITEBOARD_MINUTES - 32);
  });

  it("keeps time to wrap up when no cool-down is programmed", () => {
    expect(prepBudget(wod.parts.slice(0, 2))).toBe(
      CLASS_MINUTES - WHITEBOARD_MINUTES - 27 - WRAP_UP_MINUTES,
    );
  });

  it("counts a programmed warm-up", () => {
    const warmup = { label: "Warm-up", minutes: 10 };
    expect(prepBudget([warmup, ...wod.parts])).toBe(prepBudget(wod.parts)! - 10);
  });

  it("is unknown when a part's length is", () => {
    expect(prepBudget([{ label: "A", minutes: null }, ...wod.parts])).toBeNull();
  });
});

describe("fitPrep", () => {
  const step = (name: string, minutes: number) => ({
    name,
    minutes,
    dose: "3 × 3",
    focus: "Focus.",
    advanceWhen: null,
  });
  const skill = (movement: string, setupMinutes: number, ...minutes: number[]): SkillBlock => ({
    movement,
    why: "Why.",
    setupMinutes,
    progressions: minutes.map((m, i) => step(`${movement} ${i + 1}`, m)),
    equipment: [],
  });
  const prep = (...skills: SkillBlock[]): ClassPrep => ({ warmup: classPrep.warmup, skills });
  const steps = (fitted: ClassPrep) => fitted.skills.map((s) => s.progressions.map((p) => p.name));

  it("keeps a plan that fits", () => {
    const plan = prep(skill("Rope Climb", 3, 4, 5), skill("Toes-to-Bar", 1, 3, 4));
    // 10 + 12 + 8 = 30
    expect(fitPrep(plan, 30, { programmedWarmup: false })).toEqual(plan);
  });

  it("drops the hardest progressions of a skill that runs over", () => {
    const fitted = fitPrep(prep(skill("Rope Climb", 3, 4, 5, 5)), 22, { programmedWarmup: false });
    expect(steps(fitted)).toEqual([["Rope Climb 1", "Rope Climb 2"]]);
  });

  it("drops a skill that doesn't fit at all, and any after it", () => {
    const plan = prep(skill("Rope Climb", 3, 4, 5), skill("Toes-to-Bar", 1, 3, 4));
    expect(steps(fitPrep(plan, 24, { programmedWarmup: false }))).toEqual([
      ["Rope Climb 1", "Rope Climb 2"],
    ]);
    expect(steps(fitPrep(plan, 12, { programmedWarmup: false }))).toEqual([]);
  });

  it("drops practice too short to be worth setting up", () => {
    const fitted = fitPrep(prep(skill("Rope Climb", 1, 3)), 30, { programmedWarmup: false });
    expect(fitted.skills).toEqual([]);
  });

  it("keeps the warm-up even when the class is full", () => {
    const fitted = fitPrep(prep(skill("Rope Climb", 3, 4)), -5, { programmedWarmup: false });
    expect(fitted).toEqual({ warmup: classPrep.warmup, skills: [] });
  });

  it("drops the planned warm-up when one is programmed, giving its time to skills", () => {
    const fitted = fitPrep(prep(skill("Rope Climb", 3, 4, 5)), 12, { programmedWarmup: true });
    expect(fitted.warmup).toBeNull();
    expect(steps(fitted)).toEqual([["Rope Climb 1", "Rope Climb 2"]]);
  });

  it("keeps the plan as it is when the time is unknown", () => {
    const plan = prep(skill("Rope Climb", 3, 20, 20));
    expect(fitPrep(plan, null, { programmedWarmup: false })).toEqual(plan);
  });
});

describe("classEnd", () => {
  it("is when the last stage ends", () => {
    // 15 + 12 + 5 minutes of parts after the whiteboard.
    expect(classEnd(planClass(wod))).toBe(WHITEBOARD_MINUTES + 32);
    expect(classEnd(planClass(wod, classPrep))).toBe(WHITEBOARD_MINUTES + 32 + 21);
  });

  it("is unknown when a length along the way is", () => {
    const parts = [{ ...wod.parts[0], minutes: null }, wod.parts[1]];
    expect(classEnd(planClass({ parts }))).toBeNull();
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
