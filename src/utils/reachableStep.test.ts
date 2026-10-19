import { describe, expect, it } from "vitest";
import { reachableStep } from "./reachableStep";
import { STEP } from "@/constants/flow";
import { strengthAndMetcon } from "@/test/fixtures";
import { toWodState } from "./toWodState";

describe("reachableStep", () => {
  const wod = toWodState(strengthAndMetcon);

  it("is the first step without a workout", () => {
    expect(reachableStep(null)).toBe(STEP.workout);
  });

  it("reaches the class once the workout could be confirmed", () => {
    expect(reachableStep(wod)).toBe(STEP.class);
  });

  it("stops at Check while a part has no stimulus", () => {
    const [squats, ...rest] = wod.parts;
    const missing = { ...squats, stimulus: { ...squats.stimulus, description: "  " } };
    expect(reachableStep({ parts: [missing, ...rest] })).toBe(STEP.review);
  });
});
