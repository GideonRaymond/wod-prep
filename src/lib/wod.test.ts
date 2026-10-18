import { describe, expect, it } from "vitest";
import { WodSchema, type Movement } from "./wod";
import { fran } from "@/test/fixtures";

describe("WodSchema", () => {
  it("accepts a valid workout", () => {
    expect(WodSchema.parse(fran)).toEqual(fran);
  });

  it("accepts null for optional fields", () => {
    const wod = {
      ...fran,
      title: null,
      movements: [{ ...fran.movements[0], reps: null, load: null }],
    };
    expect(WodSchema.safeParse(wod).success).toBe(true);
  });

  it("rejects an unknown format", () => {
    expect(WodSchema.safeParse({ ...fran, format: "tabata" }).success).toBe(false);
  });

  it("rejects an unknown movement category", () => {
    const wod = { ...fran, movements: [{ ...fran.movements[0], category: "cardio" }] };
    expect(WodSchema.safeParse(wod).success).toBe(false);
  });

  it("rejects a movement without a name", () => {
    const movement: Partial<Movement> = { ...fran.movements[0] };
    delete movement.name;
    expect(WodSchema.safeParse({ ...fran, movements: [movement] }).success).toBe(false);
  });
});
