import { describe, expect, it } from "vitest";
import { describeIntensity } from "./describeIntensity";

describe("describeIntensity", () => {
  it.each([
    [1, "Easy"],
    [3, "Easy"],
    [4, "Moderate"],
    [6, "Moderate"],
    [7, "Hard"],
    [8, "Hard"],
    [9, "All-out"],
    [10, "All-out"],
  ])("%i is %s", (intensity, label) => {
    expect(describeIntensity(intensity)).toBe(label);
  });
});
