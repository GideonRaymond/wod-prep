import { describe, expect, it } from "vitest";
import { boardTitle, classBoard, partsBoard } from "./boardItems";
import { classPrep, fran, strengthAndMetcon } from "@/test/fixtures";
import { CLASS_MINUTES, classEnd, planClass } from "./classPlan";
import { toWodState } from "./toWodState";

const franParts = toWodState(fran).parts;
const classParts = toWodState(strengthAndMetcon).parts;
const headings = (items: { heading: string }[]) => items.map((item) => item.heading);

describe("boardTitle", () => {
  it("is WOD when no part has a real name", () => {
    expect(boardTitle(franParts)).toBeNull();
    expect(boardTitle(franParts.map((p) => ({ ...p, named: false })))).toBe("WOD");
  });
});

describe("partsBoard", () => {
  it("writes each part's whiteboard lines, keyed by its id", () => {
    const { items } = partsBoard(classParts);
    expect(items[0]).toEqual({ key: classParts[0].id, heading: "A. Back Squat", lines: ["5x5"] });
  });

  it("keys parts without an id (while they're read) by their place", () => {
    const { items } = partsBoard([{ named: true, sourceText: "Fran", board: ["Fran"] }]);
    expect(items[0].key).toBe("part-0");
  });

  it("writes out the part's own text when it was saved without whiteboard lines", () => {
    const old = { ...franParts[0], board: undefined, sourceText: '"Fran"\n\n21-15-9 for time' };
    expect(partsBoard([old]).items[0]).toMatchObject({
      heading: '"Fran"',
      lines: ["21-15-9 for time"],
    });
  });
});

describe("classBoard", () => {
  it("follows the class: warm-up, each skill right before its part, the parts, a cool-down", () => {
    const { items } = classBoard(franParts, classPrep);
    const left = CLASS_MINUTES - classEnd(planClass({ parts: franParts }, classPrep))!;
    expect(headings(items)).toEqual([
      "Warm-up – 10 min",
      "Skill: Pull-up – 11 min",
      "Fran",
      `Cool-down – ${left} min`,
    ]);
    expect(items.map((item) => item.key)).toEqual([
      "planned-warmup",
      "skill-Pull-up",
      franParts[0].id,
      "stretches",
    ]);
    expect(items.map((item) => item.added ?? false)).toEqual([true, true, false, true]);
  });

  it("heads it with Before class and the briefing when it's the table of contents", () => {
    const { items } = classBoard(franParts, null, { sections: true });
    expect(items.slice(0, 2)).toEqual([
      { key: "pre", heading: "Before class", lines: [], added: true },
      { key: "briefing", heading: "Briefing", lines: [], added: true },
    ]);
    expect(classBoard(franParts, null).items[0].key).toBe(franParts[0].id);
  });

  it("has just the parts and stretches before the warm-up is planned", () => {
    expect(headings(classBoard(franParts, null).items)).toEqual([
      "Fran",
      expect.stringMatching(/^Cool-down/),
    ]);
  });

  it("leaves a programmed cool-down as it is, with no stretches of its own", () => {
    const { items } = classBoard(classParts, classPrep);
    expect(items.at(-1)).toMatchObject({ key: classParts[2].id, heading: "Cool-down" });
    expect(items.map((item) => item.key)).not.toContain("stretches");
  });

  it("leaves out the planned warm-up when one is programmed", () => {
    const programmed = [{ ...franParts[0], id: "w", label: "Warm-up" }, ...franParts];
    expect(headings(classBoard(programmed, classPrep).items)).not.toContain("Warm-up – 10 min");
  });

  it("says if time allows when there's no time left for stretches", () => {
    const long = franParts.map((part) => ({ ...part, minutes: 70 }));
    expect(classBoard(long, null).items.at(-1)?.heading).toBe("Cool-down if time allows");
  });
});
