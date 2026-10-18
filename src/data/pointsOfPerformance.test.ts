import { describe, expect, it } from "vitest";
import { CURATED_POINTS_OF_PERFORMANCE } from "./pointsOfPerformance";
import { PointsOfPerformanceSchema } from "@/schemas/pointsOfPerformance";
import { normalizeMovementName } from "@/utils/normalizeMovementName";

describe("CURATED_POINTS_OF_PERFORMANCE", () => {
  it.each(CURATED_POINTS_OF_PERFORMANCE.map((e) => [e.names[0], e] as const))(
    "%s is complete and valid",
    (_name, { names, ...points }) => {
      expect(names.length).toBeGreaterThan(0);
      expect(PointsOfPerformanceSchema.parse(points)).toEqual(points);
      expect(points.cues.length).toBeGreaterThanOrEqual(3);
      expect(points.faults.length).toBeGreaterThanOrEqual(1);
      for (const { cue } of points.faults) {
        expect(cue.split(" ").length, `"${cue}" should be short`).toBeLessThanOrEqual(4);
      }
    },
  );

  it("doesn't use the same name for two movements", () => {
    const keys = CURATED_POINTS_OF_PERFORMANCE.flatMap((e) => e.names.map(normalizeMovementName));
    expect(new Set(keys).size).toBe(keys.length);
  });
});
