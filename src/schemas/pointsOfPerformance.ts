import { z } from "zod";

export const PointsOfPerformanceSchema = z.object({
  cues: z
    .array(z.string())
    .describe("3-7 points of performance: short coaching cues for good technique, in order"),
  faults: z
    .array(
      z.object({
        fault: z.string().describe('A common fault, e.g. "Heels come off the floor"'),
        fix: z
          .string()
          .describe('How to correct it, e.g. "Sit the hips back and keep the weight in the heels"'),
        cue: z
          .string()
          .describe('A short verbal cue a coach calls out mid-workout, e.g. "Heels down!"'),
      }),
    )
    .describe("2-4 of the most common faults and how to fix them"),
});

export type PointsOfPerformance = z.infer<typeof PointsOfPerformanceSchema>;

export const POINTS_SOURCES = ["curated", "ai"] as const;
export type PointsSource = (typeof POINTS_SOURCES)[number];
