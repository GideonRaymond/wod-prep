import { describe, expect, it } from "vitest";
import { MOVEMENT_AREAS, STRETCHES, STRETCH_AREAS } from "./stretches";

describe("STRETCHES", () => {
  it("gives every stretch a YouTube demo, a dose and at least one area", () => {
    for (const stretch of STRETCHES) {
      expect(stretch.video.url, stretch.name).toMatch(
        /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/,
      );
      expect(stretch.video.duration, stretch.name).toMatch(/^\d+:\d\d$/);
      expect(stretch.dose, stretch.name).not.toBe("");
      expect(stretch.areas.length, stretch.name).toBeGreaterThan(0);
    }
  });

  it("names each stretch and video once", () => {
    const names = STRETCHES.map((s) => s.name);
    const urls = STRETCHES.map((s) => s.video.url);
    expect(new Set(names).size).toBe(names.length);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("has a choice of stretches for every area, so suggestions vary", () => {
    for (const area of STRETCH_AREAS) {
      const options = STRETCHES.filter((s) => s.areas.includes(area)).length;
      const minimum = area === "triceps" || area === "forearms" ? 2 : 3;
      expect(options, area).toBeGreaterThanOrEqual(minimum);
    }
  });

  it("only maps movements to known areas", () => {
    for (const rule of MOVEMENT_AREAS) {
      for (const area of rule.areas) expect(STRETCH_AREAS).toContain(area);
    }
  });
});
