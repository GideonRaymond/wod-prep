import { describe, expect, it } from "vitest";
import { mergeDuplicateMovements, sumReps } from "./mergeDuplicateMovements";
import type { Movement } from "@/schemas/wod";

const movement = (overrides: Partial<Movement>): Movement => ({
  name: "Run",
  originalText: "1 mile run",
  reps: "1 mile",
  load: null,
  category: "monostructural",
  ...overrides,
});

describe("sumReps", () => {
  it.each([
    ["1 mile", "1 mile", "2 miles"],
    ["0.5 mile", "0.5 mi", "1 mile"],
    ["400 m", "400m", "800 m"],
    ["200 meters", "300 m", "500 m"],
    ["1 km", "2k", "3 km"],
    ["15 cal", "10 calories", "25 cal"],
    ["50", "50", "100"],
    ["10 reps", "5", "15"],
    ["0.1 mile", "0.2 mile", "0.3 miles"],
  ])("%s + %s = %s", (a, b, total) => {
    expect(sumReps(a, b)).toBe(total);
  });

  it("joins amounts it can't add up", () => {
    expect(sumReps("1 mile", "400 m")).toBe("1 mile + 400 m");
    expect(sumReps("21-15-9", "21-15-9")).toBe("21-15-9 + 21-15-9");
    expect(sumReps("Max reps", "10")).toBe("Max reps + 10");
  });

  it("keeps the known amount when one is missing", () => {
    expect(sumReps(null, "1 mile")).toBe("1 mile");
    expect(sumReps("1 mile", null)).toBe("1 mile");
    expect(sumReps(null, null)).toBeNull();
  });
});

describe("mergeDuplicateMovements", () => {
  it("combines Murph's two runs into one entry with the total distance", () => {
    const murph = [
      movement({ originalText: "1 mile Run" }),
      movement({
        name: "Pull-up",
        reps: "100",
        category: "gymnastics",
        originalText: "100 Pull-ups",
      }),
      movement({
        name: "Push-up",
        reps: "200",
        category: "gymnastics",
        originalText: "200 Push-ups",
      }),
      movement({
        name: "Air Squat",
        reps: "300",
        category: "gymnastics",
        originalText: "300 Squats",
      }),
      movement({ originalText: "1 mile Run" }),
    ];

    const merged = mergeDuplicateMovements(murph);

    expect(merged.map((m) => m.name)).toEqual(["Run", "Pull-up", "Push-up", "Air Squat"]);
    expect(merged[0]).toMatchObject({ reps: "2 miles", originalText: "1 mile Run · 1 mile Run" });
  });

  it("matches names regardless of case, punctuation and plurals", () => {
    const merged = mergeDuplicateMovements([
      movement({ name: "Pull-ups", reps: "50" }),
      movement({ name: "pull up", reps: "50" }),
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].reps).toBe("100");
  });

  it("keeps the same movement at different loads separate", () => {
    const merged = mergeDuplicateMovements([
      movement({ name: "Deadlift", load: "225 lb", reps: "5" }),
      movement({ name: "Deadlift", load: "315 lb", reps: "3" }),
      movement({ name: "Deadlift", load: "225lb", reps: "5" }),
    ]);
    expect(merged.map((m) => [m.load, m.reps])).toEqual([
      ["225 lb", "10"],
      ["315 lb", "3"],
    ]);
  });

  it("leaves a list without duplicates unchanged", () => {
    const list = [movement({}), movement({ name: "Row" })];
    expect(mergeDuplicateMovements(list)).toEqual(list);
  });
});
