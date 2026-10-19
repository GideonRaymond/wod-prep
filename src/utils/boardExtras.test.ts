import { describe, expect, it } from "vitest";
import { boardExtras } from "./boardExtras";
import { classPrep, fran, strengthAndMetcon } from "@/test/fixtures";
import { classStretches } from "./suggestStretches";
import { toWodState } from "./toWodState";

const franParts = toWodState(fran).parts;

describe("boardExtras", () => {
  it("writes up the planned warm-up, with its rounds and each drill's dose", () => {
    expect(boardExtras(franParts, classPrep).warmup).toEqual({
      heading: "Warm-up",
      lines: [
        "2 rounds, not for time",
        "Easy row – 2 min",
        "World's greatest stretch – 3 each side",
        "Empty-bar thruster",
      ],
    });
  });

  it("has no warm-up before it's planned, or when one is programmed", () => {
    expect(boardExtras(franParts, null).warmup).toBeNull();
    const programmed = [{ ...franParts[0], label: "Warm-up" }, ...franParts];
    expect(boardExtras(programmed, classPrep).warmup).toBeNull();
  });

  it("adds the suggested stretches as a cool-down", () => {
    const stretches = classStretches(franParts);
    expect(stretches.length).toBeGreaterThan(0);
    expect(boardExtras(franParts, null).cooldown).toEqual({
      heading: "Cool-down",
      lines: stretches.map((s) => `${s.name} – ${s.dose}`),
    });
  });

  it("leaves a programmed cool-down as it is", () => {
    expect(boardExtras(toWodState(strengthAndMetcon).parts, null).cooldown).toBeNull();
  });
});
