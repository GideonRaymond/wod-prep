import { describe, expect, it } from "vitest";
import { STEP, stepTransition } from "./flow";

describe("stepTransition", () => {
  it("goes forward to a later step and back to an earlier one", () => {
    expect(stepTransition(STEP.workout, STEP.review)).toEqual(["nav-forward"]);
    expect(stepTransition(STEP.class, STEP.workout)).toEqual(["nav-back"]);
  });
});
