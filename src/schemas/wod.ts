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
  title: z.string().nullable().describe('Named WOD if given, e.g. "Fran"'),
  format: z.enum(["for_time", "amrap", "emom", "rounds", "intervals", "strength", "other"]),
  duration: z
    .string()
    .nullable()
    .describe('Time cap or duration, e.g. "12 min AMRAP", "20 min cap"'),
  rounds: z.string().nullable().describe('Round scheme, e.g. "5 rounds", "21-15-9"'),
  movements: z.array(MovementSchema),
  stimulus: StimulusSchema,
  notes: z.string().nullable().describe("Anything else worth knowing (rest, partner, buy-in)"),
});

/** A day's programming: one part, or several (A, B, C, cool-down, ...). */
export const WodSchema = z.object({
  parts: z.array(WorkoutPartSchema).min(1),
});

export type Movement = z.infer<typeof MovementSchema>;
export type Stimulus = z.infer<typeof StimulusSchema>;
export type WorkoutPart = z.infer<typeof WorkoutPartSchema>;
export type Wod = z.infer<typeof WodSchema>;
