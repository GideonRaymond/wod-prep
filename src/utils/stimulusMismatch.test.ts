import { describe, expect, it } from "vitest";
import { stimulusMismatch } from "./stimulusMismatch";

describe("stimulusMismatch", () => {
  it.each([
    ["Super hard, all-out sprint.", 1],
    ["Heavy singles.", 2],
    ["Redline the whole way.", 3],
  ])("spots %j rated %i as sounding harder than its intensity", (description, intensity) => {
    expect(stimulusMismatch(description, intensity)).toBe("hard");
  });

  it.each([
    ["Easy flush to recover.", 9],
    ["Conversational pace, zone 2.", 8],
  ])("spots %j rated %i as sounding easier than its intensity", (description, intensity) => {
    expect(stimulusMismatch(description, intensity)).toBe("easy");
  });

  it.each([
    ["Super hard, all-out sprint.", 9],
    ["Easy flush to recover.", 2],
    ["Heavy singles.", 5],
    ["Steady pace on the rower.", 1],
    ["Easy start, then all-out for the last minute.", 1],
  ])("lets %j rated %i be", (description, intensity) => {
    expect(stimulusMismatch(description, intensity)).toBeNull();
  });
});
