import "server-only";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { CURATED_POINTS_OF_PERFORMANCE } from "@/data/pointsOfPerformance";
import { PointsOfPerformanceSchema, type PointsOfPerformance } from "@/schemas/pointsOfPerformance";
import { normalizeMovementName } from "@/utils/normalizeMovementName";
import { anthropic, MODEL } from "./anthropic";
import { UnusableResultError } from "./apiErrors";
import { createFileCache } from "./fileCache";

/** Bump when the prompt or schema changes, so old AI results get generated again. */
export const POINTS_CACHE_VERSION = 2;

const cache = createFileCache("points-of-performance", PointsOfPerformanceSchema);
const cacheKey = (name: string) => `v${POINTS_CACHE_VERSION}:${normalizeMovementName(name)}`;

const curated = new Map<string, PointsOfPerformance>(
  CURATED_POINTS_OF_PERFORMANCE.flatMap(({ names, cues, faults }) =>
    names.map((name) => [normalizeMovementName(name), { cues, faults }] as const),
  ),
);

/** Hand-written points of performance for common movements. */
export function findCuratedPoints(name: string): PointsOfPerformance | null {
  return curated.get(normalizeMovementName(name)) ?? null;
}

export function getCachedPoints(name: string) {
  return cache.get(cacheKey(name));
}

export function cachePoints(name: string, points: PointsOfPerformance) {
  return cache.set(cacheKey(name), points);
}

const SYSTEM = `You are an experienced CrossFit coach. Give the points of performance for the movement the user names, the way they're taught in CrossFit coaching:
- cues: short, plain coaching cues in order from setup to finish.
- faults: the most common faults, each with how to fix it and a short verbal cue (1-4 words) a coach would call out mid-workout, like "Knees out!".
If the text isn't a real exercise, return empty lists.`;

/** Asks Claude for the points of performance of a movement that isn't curated. */
export async function generatePoints(name: string): Promise<PointsOfPerformance> {
  const response = await anthropic.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "low", format: betaZodOutputFormat(PointsOfPerformanceSchema) },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    messages: [{ role: "user", content: name }],
  });

  if (response.stop_reason === "refusal") {
    throw new UnusableResultError("The model declined to describe this movement.");
  }
  const points = response.parsed_output;
  if (!points || points.cues.length === 0) {
    throw new UnusableResultError(`Couldn't find points of performance for "${name}".`);
  }
  return points;
}
