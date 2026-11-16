import { describe, expect, it } from "vitest";
import { classPrep } from "@/test/fixtures";
import { alternativesFor } from "./movementAlternatives";

const [thruster, pullUp] = classPrep.alternatives;

describe("alternativesFor", () => {
  it("finds a movement's alternatives in its own part, however it's spelled", () => {
    expect(alternativesFor(classPrep.alternatives, 0, "Pull-up")).toBe(pullUp);
    expect(alternativesFor(classPrep.alternatives, 0, "pull ups")).toBe(pullUp);
    expect(alternativesFor(classPrep.alternatives, 0, "Thrusters")).toBe(thruster);
  });

  it("falls back to a name that contains the other", () => {
    expect(alternativesFor(classPrep.alternatives, 0, "Strict Pull-up")).toBe(pullUp);
  });

  it("keeps parts apart, and has nothing for a movement it wasn't planned for", () => {
    expect(alternativesFor(classPrep.alternatives, 1, "Pull-up")).toBeNull();
    expect(alternativesFor(classPrep.alternatives, 0, "Row")).toBeNull();
    expect(alternativesFor(undefined, 0, "Pull-up")).toBeNull();
  });
});
