import { z } from "zod";
import { MAX_MOVEMENT_NAME_LENGTH } from "@/constants/wod";
import { MovementSchema, WorkoutPartSchema } from "@/schemas/wod";

export const WarmupDrillSchema = z.object({
  name: z.string().describe('The drill, e.g. "Inchworm", "Empty-bar front squat"'),
  dose: z.string().nullable().describe('e.g. "10 reps", "200 m", "30 s each side"'),
});

/** A warm-up planned for the class, when none is programmed. */
export const WarmupPlanSchema = z.object({
  minutes: z.number().int().positive().describe("How long the whole warm-up takes in class"),
  focus: z
    .string()
    .describe("What the warm-up prepares athletes for and why, in one or two short sentences"),
  rounds: z.string().nullable().describe('A round scheme if any, e.g. "2 rounds, not for time"'),
  drills: z.array(WarmupDrillSchema),
  equipment: z.array(z.string()).describe("Equipment the warm-up needs, by common name"),
});

/** One step from the simplest version of a skill toward the full movement. */
export const ProgressionSchema = z.object({
  name: z.string().describe('e.g. "Hanging knee raise", "Seated rope pull"'),
  minutes: z
    .number()
    .int()
    .positive()
    .describe("Class time for this step: explaining, demonstrating and practicing with feedback"),
  dose: z.string().describe('e.g. "3 × 5 reps", "3 attempts"'),
  focus: z.string().describe("The one coaching point for this step, in a short sentence"),
  advanceWhen: z
    .string()
    .nullable()
    .describe(
      'When an athlete moves on to the next step, e.g. "5 controlled reps"; null for the last',
    ),
});

/** Practice for one skill movement in today's workout, built up in progressions. */
export const SkillBlockSchema = z.object({
  movement: z.string().describe("The skill movement from the workout, by its name there"),
  why: z.string().describe("Why practice it today, in one short sentence"),
  setupMinutes: z
    .number()
    .int()
    .describe("Minutes to set up and put away the equipment for this practice"),
  progressions: z.array(ProgressionSchema),
  equipment: z.array(z.string()).describe("Equipment the practice needs, by common name"),
});

/** Another movement to do instead, and how it keeps the part's stimulus. */
export const AlternativeSchema = z.object({
  name: z
    .string()
    .describe('The movement to do instead, with its dose if it changes, e.g. "Jumping pull-up"'),
  why: z.string().describe("How it keeps today's stimulus, in one short sentence"),
});

/** What to do instead of one movement of a workout part, and whether it suits pregnancy. */
export const MovementAlternativesSchema = z.object({
  part: z.number().int().min(0).describe("The index of the part in the request's parts"),
  movement: z.string().describe("The movement, by its name in that part"),
  similar: AlternativeSchema.describe(
    "The closest version of the same movement pattern, for athletes who can do something like it (shoulder press for push press, ring row for pull-up)",
  ),
  different: AlternativeSchema.describe(
    "A completely different movement for athletes who can't do this one at all, training the same muscles or energy system (Z-press for handstand push-up, bike for running)",
  ),
  pregnancy: z.object({
    avoid: z
      .boolean()
      .describe(
        "True when pregnant athletes should generally not do this movement as written (high impact, inverted, lying on the back, heavy bracing or a fall risk)",
      ),
    why: z.string().nullable().describe("Why, in a few words, when avoid is true; null otherwise"),
  }),
});

/** The start of class: a warm-up (null when one is programmed) and skill practice, if needed. */
export const ClassPrepSchema = z.object({
  warmup: WarmupPlanSchema.nullable(),
  skills: z.array(SkillBlockSchema),
  alternatives: z
    .array(MovementAlternativesSchema)
    .describe("One entry per movement of every workout part (not a warm-up or cool-down)"),
});

export type WarmupPlan = z.infer<typeof WarmupPlanSchema>;
export type SkillBlock = z.infer<typeof SkillBlockSchema>;
export type Alternative = z.infer<typeof AlternativeSchema>;
export type MovementAlternatives = z.infer<typeof MovementAlternativesSchema>;
export type ClassPrep = z.infer<typeof ClassPrepSchema>;

const text = (max: number) => z.string().trim().max(max);

/** What /api/class-prep needs from each part of the day's workout. */
export const PrepRequestSchema = z.object({
  parts: z
    .array(
      z.object({
        label: text(60).nullable(),
        title: text(120).min(1),
        format: WorkoutPartSchema.shape.format,
        rounds: text(200).nullable(),
        duration: text(200).nullable(),
        minutes: z.number().int().positive().max(240).nullable(),
        movements: z
          .array(
            z.object({
              name: text(MAX_MOVEMENT_NAME_LENGTH).min(1),
              reps: text(200).nullable(),
              load: text(200).nullable(),
              category: MovementSchema.shape.category,
            }),
          )
          .max(30),
        stimulus: text(1000),
        intensity: z.number().int().min(1).max(10),
      }),
    )
    .min(1)
    .max(10),
});

export type PrepRequest = z.infer<typeof PrepRequestSchema>;
