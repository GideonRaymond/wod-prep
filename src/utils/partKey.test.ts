import { describe, expect, it } from "vitest";
import { boardOutdated, partKey, wodEdited } from "./partKey";
import { strengthAndMetcon } from "@/test/fixtures";
import { toWodState } from "./toWodState";

const [squats, fran] = toWodState(strengthAndMetcon).parts;

describe("partKey", () => {
  it("changes with anything the board shows", () => {
    const base = partKey(fran);
    expect(partKey({ ...fran, rounds: "15-12-9" })).not.toBe(base);
    expect(partKey({ ...fran, title: "Fran-ish" })).not.toBe(base);
    expect(partKey({ ...fran, movements: fran.movements.slice(1) })).not.toBe(base);
    const lighter = fran.movements.map((m, i) => (i === 0 ? { ...m, load: "75/55 lb" } : m));
    expect(partKey({ ...fran, movements: lighter })).not.toBe(base);
  });

  it("ignores what the board doesn't show: ids, categories, the stimulus and videos", () => {
    const base = partKey(fran);
    const movements = fran.movements.map((m) => ({ ...m, id: "x", category: "other" as const }));
    const stimulus = { description: "Different", intensity: 3 };
    const changed: typeof fran = { ...fran, movements, stimulus, videos: [] };
    expect(partKey(changed)).toBe(base);
  });
});

describe("boardOutdated", () => {
  it("is false until the part is edited", () => {
    expect(boardOutdated(fran)).toBe(false);
    expect(boardOutdated({ ...fran, rounds: "15-12-9" })).toBe(true);
  });

  it("is false for a part saved without a board, which shows its own text instead", () => {
    const old = { ...fran, rounds: "15-12-9", board: undefined, boardKey: undefined };
    expect(boardOutdated(old)).toBe(false);
  });
});

describe("wodEdited", () => {
  it("spots an edit to any part, or to a stimulus", () => {
    expect(wodEdited([squats, fran])).toBe(false);
    expect(wodEdited([squats, { ...fran, movements: fran.movements.slice(1) }])).toBe(true);
    const stimulus = { ...fran.stimulus, description: "Go!" };
    expect(wodEdited([squats, { ...fran, stimulus }])).toBe(true);
  });

  it("still counts an edit once the board is redrawn with it", () => {
    const edited = { ...fran, rounds: "15-12-9" };
    expect(wodEdited([{ ...edited, boardKey: partKey(edited) }])).toBe(true);
  });
});
