import "server-only";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { ClassPrepSchema, type ClassPrep, type PrepRequest } from "@/schemas/classPrep";
import {
  CLASS_MINUTES,
  MIN_WARMUP_MINUTES,
  fitPrep,
  prepBudget,
  stageKind,
} from "@/utils/classPlan";
import { anthropic, MODEL } from "./anthropic";
import { UnusableResultError } from "./apiErrors";
import { createFileCache } from "./fileCache";
import { normalizeWodText } from "./wodCache";

/** Bump when the prompt or schema changes, so old plans are made again. */
export const PREP_CACHE_VERSION = 1;

/** A plan for the same workout is reused for a month, like videos and articles. */
export const PREP_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const CacheEntrySchema = z.object({ savedAt: z.number(), prep: ClassPrepSchema });
const cache = createFileCache("class-prep", CacheEntrySchema);

/** The same parts (formats, schemes, lengths and movements) get the same plan; titles and stimulus text don't matter. */
export function prepCacheKey(request: PrepRequest) {
  const about = request.parts.map((part) =>
    [
      part.label,
      part.format,
      part.rounds,
      part.duration,
      part.minutes && `${part.minutes} min`,
      ...part.movements.map((m) => [m.reps, m.load, m.name].filter(Boolean).join(" ")),
    ]
      .filter(Boolean)
      .join(" "),
  );
  return `v${PREP_CACHE_VERSION}:${normalizeWodText(about.join(" / "))}`;
}

export async function getCachedPrep(request: PrepRequest) {
  const entry = await cache.get(prepCacheKey(request));
  if (!entry || Date.now() - entry.savedAt > PREP_MAX_AGE_MS) return null;
  return entry.prep;
}

export function cachePrep(request: PrepRequest, prep: ClassPrep) {
  return cache.set(prepCacheKey(request), { savedAt: Date.now(), prep });
}

const SYSTEM = `You're an experienced CrossFit coach planning the start of a ${CLASS_MINUTES}-minute group class for about 12 athletes of mixed ability, with one coach. You get the day's parts, which of them are a programmed warm-up or cool-down, and how many minutes are left for your warm-up and skill practice. Plan:

1. warmup (null when a warm-up is already programmed): general to specific, for today's movements and stimulus, in this order:
   a. If time allows, about 2 minutes of easy cardio to warm the body up and get it ready to move (rower, bike, ski erg, an easy jog or jump rope).
   b. Dynamic stretching for the joints and muscles today's movements use (e.g. leg swings, inchworms, world's greatest stretch, arm circles). This has priority over the cardio: when time is short, drop the cardio, never the stretching.
   c. Today's movements at low intensity, building toward working intensity or loads.
   Use simple drills a class can follow together without much explaining. Give its focus (what it prepares and why), a round scheme if it has one, each drill with its dose, and the equipment.

2. skills: practice for skill movements only. These are gymnastics skills like rope climbs, toes-to-bar, muscle-ups, handstand push-ups and walks, double-unders, pistols and kipping or butterfly pull-ups, and technical lifts like the snatch or the clean and jerk. Simple movements (air squats, push-ups, running, rowing, burpees, box jumps, wall balls, kettlebell swings, deadlifts) never get skill practice. Return an empty list when there are none. At most two skills, the one that matters most for today first. For each, give progressions from the simplest step to the full movement: everyone starts at the first and moves on when they meet its advanceWhen, so the steps double as scaling options for the workout.

Mind the equipment for 12 athletes at once. A typical gym has a barbell, a box and a jump rope for everyone, but only a few of the rest: about 4-6 rowers or bikes, 3-4 ropes, 4-6 sets of rings and limited rig space. When there isn't one each, plan for it: mix machines with a jog or jump rope, or rotate small groups and count the extra time. Only list equipment the plan really uses.

Be realistic about time:
- Explaining and demonstrating each progression takes 1-2 minutes before anyone moves.
- Then 12 athletes need enough reps with feedback from one coach. Allow at least 3 minutes per progression in total, more when equipment is shared: with 3-4 ropes or rings, athletes rotate in groups and each attempt takes 30-60 seconds.
- Setting up and putting away equipment (ropes, rings, boxes, barbells, mats) takes 2-3 minutes whenever it changes; count that in setupMinutes.
- A warm-up takes at least ${MIN_WARMUP_MINUTES} minutes; 10-12 is typical. A warm-up that also covers barbell work up to working loads takes longer.
- Stay within the minutes available: the warm-up's minutes plus each skill's setupMinutes and progression minutes must add up to no more. When time is short, keep the warm-up and use fewer progressions or one skill. If there's no room for skill practice at all, return no skills and put one or two of its simplest drills in the warm-up instead. When the minutes available are unknown, assume about 15.

Write plainly and briefly, like a coach's plan, with doses like "3 × 5 reps", "2 × 30 s" or "3 attempts".`;

/**
 * Asks Claude to plan a warm-up (unless one is programmed) and skill practice for the day's
 * workout, then makes sure it fits the time the class has left.
 */
export async function planPrep(request: PrepRequest): Promise<ClassPrep> {
  const programmedWarmup = request.parts.some((part) => stageKind(part) === "warmup");
  const budget = prepBudget(request.parts);

  const response = await anthropic.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "medium", format: betaZodOutputFormat(ClassPrepSchema) },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          minutesForWarmupAndSkills: budget === null ? "unknown" : Math.max(budget, 0),
          programmedWarmup,
          parts: request.parts.map((part) => ({ ...part, stage: stageKind(part) })),
        }),
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new UnusableResultError("The model declined to plan this class.");
  }
  if (!response.parsed_output) {
    throw new UnusableResultError("Couldn't read the model's warm-up plan.");
  }
  return fitPrep(response.parsed_output, budget, { programmedWarmup });
}
