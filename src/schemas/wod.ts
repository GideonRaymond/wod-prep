import { z } from "zod";

export const MovementSchema = z.object({
  name: z.string().describe('Canonical movement name, e.g. "Toes-to-Bar", "Thruster", "Row"'),
  originalText: z.string().describe("The movement line exactly as written in the WOD"),
  reps: z
    .string()
    .nullable()
    .describe('Reps, calories, distance or time per round, e.g. "21-15-9", "15 cal", "400 m"'),
  load: z
    .string()
    .nullable()
    .describe('Prescribed load if any, e.g. "95/65 lb", "24/20 in box", "20/14 lb ball"'),
  category: z.enum(["weightlifting", "gymnastics", "monostructural", "other"]),
});

export const StimulusSchema = z.object({
  description: z
    .string()
    .describe(
      "The intended stimulus in 1-3 sentences: energy system, intensity, target time or pace, and how it should feel",
    ),
  intensity: z
    .number()
    .int()
    .min(1)
    .max(10)
    .describe("Intended intensity from 1 (easy, recovery) to 10 (all-out max effort)"),
});

export const WorkoutPartSchema = z.object({
  label: z
    .string()
    .nullable()
    .describe(
      'The part\'s label as programmed, e.g. "A", "B", "C", "Cool-down"; null for a single-part WOD',
    ),
  title: z
    .string()
    .describe(
      'The workout\'s name if it has one (e.g. "Fran", "Murph"); otherwise a short, descriptive 2-4 word title based on its type and feel, e.g. "Heavy Back Squats", "Intense Couplet", "Easy Flush"',
    ),
  named: z
    .boolean()
    .describe("True when the title is the workout's real name, false when you made it up"),
  sourceText: z
    .string()
    .describe("The lines of the original text that belong to this part, copied exactly"),
  board: z
    .array(z.string())
    .describe(
      'The part as a coach writes it on the whiteboard, one short line each: a heading first (its label and name, e.g. "A. Back Squat", "Murph"), then the format or scheme and every movement with its reps and load, in order. Write a named workout out in full ("Murph" becomes "Murph", "For time", "1 mile run", "100 pull-ups", "200 push-ups", "300 air squats", "1 mile run"). Drop filler like "just" or "today we do"; keep reps and loads as written',
    ),
  format: z.enum(["for_time", "amrap", "emom", "rounds", "intervals", "strength", "other"]),
  duration: z
    .string()
    .nullable()
    .describe('Time cap or duration, e.g. "12 min AMRAP", "20 min cap"'),
  rounds: z.string().nullable().describe('Round scheme, e.g. "5 rounds", "21-15-9"'),
  movements: z.array(MovementSchema),
  stimulus: StimulusSchema,
  notes: z.string().nullable().describe("Anything else worth knowing (rest, partner, buy-in)"),
  minutes: z
    .number()
    .int()
    .positive()
    .nullable()
    .describe(
      "Roughly how many minutes of class this part takes, including setup and rest: its time cap or duration when given, otherwise your estimate; null if you can't tell",
    ),
  equipment: z
    .array(z.string())
    .describe(
      'Equipment members need for this part, by common name, e.g. "Barbell", "Pull-up bar", "Rower", "Resistance band"; empty if none',
    ),
});

/** A day's programming: one part, or several (A, B, C, cool-down, ...). */
export const WodSchema = z.object({
  parts: z.array(WorkoutPartSchema).min(1),
});

/** Where a part sits in a class. */
export const PART_KINDS = ["warmup", "part", "cooldown"] as const;

/** A part as the first, quick read of a workout finds it: just enough to show its structure. */
export const PartOutlineSchema = WorkoutPartSchema.pick({
  label: true,
  title: true,
  named: true,
  sourceText: true,
  board: true,
}).extend({
  kind: z
    .enum(PART_KINDS)
    .describe("warmup or cooldown for a warm-up or cool-down part, otherwise part"),
});

/** The structure of a day's programming, from the quick first read. */
export const WodOutlineSchema = z.object({ parts: z.array(PartOutlineSchema).min(1) });

/** Everything about a part besides its outline, from the slower second read. */
export const PartDetailsSchema = WorkoutPartSchema.omit({
  label: true,
  title: true,
  named: true,
  sourceText: true,
  board: true,
});

export type Movement = z.infer<typeof MovementSchema>;
export type Stimulus = z.infer<typeof StimulusSchema>;
export type WorkoutPart = z.infer<typeof WorkoutPartSchema>;
export type Wod = z.infer<typeof WodSchema>;
export type PartKind = (typeof PART_KINDS)[number];
export type PartOutline = z.infer<typeof PartOutlineSchema>;
export type PartDetails = z.infer<typeof PartDetailsSchema>;
