import { z } from "zod";
import { MovementSchema, WorkoutPartSchema } from "@/schemas/wod";
import type { WodState } from "@/types/wod";

/** Validates a WOD restored from storage, so stale or tampered data is dropped instead of crashing. */
export const WodStateSchema: z.ZodType<WodState> = z.object({
  parts: z
    .array(
      WorkoutPartSchema.extend({
        id: z.string(),
        originalStimulus: z.string(),
        movements: z.array(MovementSchema.extend({ id: z.string() })),
      }),
    )
    .min(1),
});
