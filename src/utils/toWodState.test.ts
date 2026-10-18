import { describe, expect, it } from "vitest";
import { toWodState } from "./toWodState";
import { strengthAndMetcon } from "@/test/fixtures";

describe("toWodState", () => {
  it("adds unique ids to every part and movement", () => {
    const { parts } = toWodState(strengthAndMetcon);
    const ids = [...parts.map((p) => p.id), ...parts.flatMap((p) => p.movements.map((m) => m.id))];
    expect(ids.every((id) => typeof id === "string")).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps the parsed stimulus as the original to revert to", () => {
    const { parts } = toWodState(strengthAndMetcon);
    expect(parts.map((p) => p.originalStimulus)).toEqual(
      strengthAndMetcon.parts.map((p) => p.stimulus.description),
    );
  });
});
