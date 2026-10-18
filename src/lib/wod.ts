import { z } from "zod";

export const MAX_WOD_LENGTH = 4000;

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

export const WodSchema = z.object({
  title: z.string().nullable().describe('Named WOD if given, e.g. "Fran"'),
  format: z.enum(["for_time", "amrap", "emom", "rounds", "intervals", "strength", "other"]),
  duration: z
    .string()
    .nullable()
    .describe('Time cap or duration, e.g. "12 min AMRAP", "20 min cap"'),
  rounds: z.string().nullable().describe('Round scheme, e.g. "5 rounds", "21-15-9"'),
  movements: z.array(MovementSchema),
  notes: z.string().nullable().describe("Anything else worth knowing (rest, partner, buy-in)"),
});

export type Movement = z.infer<typeof MovementSchema>;
export type Wod = z.infer<typeof WodSchema>;
