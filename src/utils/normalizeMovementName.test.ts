import { describe, expect, it } from "vitest";
import { normalizeMovementName } from "./normalizeMovementName";

describe("normalizeMovementName", () => {
  it("ignores case, spacing, punctuation and plurals", () => {
    const key = normalizeMovementName("Pull-up");
    expect(normalizeMovementName("pull ups")).toBe(key);
    expect(normalizeMovementName("PULLUPS")).toBe(key);
    expect(normalizeMovementName("Toes-to-Bar")).toBe(normalizeMovementName("toes to bar"));
  });

  it("keeps different movements apart", () => {
    expect(normalizeMovementName("Push-up")).not.toBe(normalizeMovementName("Pull-up"));
  });
});
