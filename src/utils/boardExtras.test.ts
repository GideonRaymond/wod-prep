import { describe, expect, it } from "vitest";
import { boardExtras } from "./boardExtras";
import { classPrep, fran, strengthAndMetcon } from "@/test/fixtures";
import { CLASS_MINUTES, classEnd, planClass } from "./classPlan";
import { toWodState } from "./toWodState";

const franParts = toWodState(fran).parts;

describe("boardExtras", () => {
  it("writes the planned warm-up as its name and length, on one line", () => {
    expect(boardExtras(franParts, classPrep).warmup).toEqual({
      heading: "Warm-up – 10 min",
      lines: [],
    });
  });

  it("has no warm-up before it's planned, or when one is programmed", () => {
    expect(boardExtras(franParts, null).warmup).toBeNull();
    const programmed = [{ ...franParts[0], label: "Warm-up" }, ...franParts];
    expect(boardExtras(programmed, classPrep).warmup).toBeNull();
  });

  it("adds a cool-down for the stretches with the minutes left at the end of class", () => {
    const left = CLASS_MINUTES - classEnd(planClass({ parts: franParts }, classPrep))!;
    expect(left).toBeGreaterThan(0);
    expect(boardExtras(franParts, classPrep).cooldown).toEqual({
      heading: `Cool-down – ${left} min`,
      lines: [],
    });
  });

  it("says if time allows when there's no time left, or it's unknown", () => {
    const long = franParts.map((part) => ({ ...part, minutes: 70 }));
    expect(boardExtras(long, null).cooldown?.heading).toBe("Cool-down if time allows");
    const unknown = franParts.map((part) => ({ ...part, minutes: null }));
    expect(boardExtras(unknown, null).cooldown?.heading).toBe("Cool-down if time allows");
  });

  it("leaves a programmed cool-down as it is", () => {
    expect(boardExtras(toWodState(strengthAndMetcon).parts, null).cooldown).toBeNull();
  });
});
