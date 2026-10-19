import { describe, expect, it } from "vitest";
import { WodSchema, WorkoutPartSchema, type Movement, type WorkoutPart } from "./wod";
import { fran, franPart, strengthAndMetcon } from "@/test/fixtures";

describe("WodSchema", () => {
  it("accepts a single-part and a multi-part workout", () => {
    expect(WodSchema.parse(fran)).toEqual(fran);
    expect(WodSchema.parse(strengthAndMetcon)).toEqual(strengthAndMetcon);
  });

  it("needs at least one part", () => {
    expect(WodSchema.safeParse({ parts: [] }).success).toBe(false);
  });
});

describe("WorkoutPartSchema", () => {
  it("accepts null for optional fields", () => {
    const part = {
      ...franPart,
      label: null,
      movements: [{ ...franPart.movements[0], reps: null, load: null }],
    };
    expect(WorkoutPartSchema.safeParse(part).success).toBe(true);
  });

  it("requires a title and whether it's the workout's real name", () => {
    expect(WorkoutPartSchema.safeParse({ ...franPart, title: null }).success).toBe(false);
    const part: Partial<WorkoutPart> = { ...franPart };
    delete part.named;
    expect(WorkoutPartSchema.safeParse(part).success).toBe(false);
  });

  it("requires a stimulus with a description and intensity", () => {
    const part: Partial<WorkoutPart> = { ...franPart };
    delete part.stimulus;
    expect(WorkoutPartSchema.safeParse(part).success).toBe(false);
    expect(
      WorkoutPartSchema.safeParse({ ...franPart, stimulus: { description: "Fast" } }).success,
    ).toBe(false);
  });

  it.each([0, 11, 6.5])("rejects intensity %s", (intensity) => {
    const part = { ...franPart, stimulus: { ...franPart.stimulus, intensity } };
    expect(WorkoutPartSchema.safeParse(part).success).toBe(false);
  });

  it.each([1, 10])("accepts intensity %s", (intensity) => {
    const part = { ...franPart, stimulus: { ...franPart.stimulus, intensity } };
    expect(WorkoutPartSchema.safeParse(part).success).toBe(true);
  });

  it("takes the part's length in minutes, or null when it can't be told", () => {
    expect(WorkoutPartSchema.safeParse({ ...franPart, minutes: null }).success).toBe(true);
    expect(WorkoutPartSchema.safeParse({ ...franPart, minutes: 0 }).success).toBe(false);
    expect(WorkoutPartSchema.safeParse({ ...franPart, minutes: 7.5 }).success).toBe(false);
  });

  it("requires the equipment list, which may be empty", () => {
    expect(WorkoutPartSchema.safeParse({ ...franPart, equipment: [] }).success).toBe(true);
    const part: Partial<WorkoutPart> = { ...franPart };
    delete part.equipment;
    expect(WorkoutPartSchema.safeParse(part).success).toBe(false);
  });

  it("rejects an unknown format", () => {
    expect(WorkoutPartSchema.safeParse({ ...franPart, format: "tabata" }).success).toBe(false);
  });

  it("rejects an unknown movement category", () => {
    const part = { ...franPart, movements: [{ ...franPart.movements[0], category: "cardio" }] };
    expect(WorkoutPartSchema.safeParse(part).success).toBe(false);
  });

  it("rejects a movement without a name", () => {
    const movement: Partial<Movement> = { ...franPart.movements[0] };
    delete movement.name;
    expect(WorkoutPartSchema.safeParse({ ...franPart, movements: [movement] }).success).toBe(false);
  });
});
