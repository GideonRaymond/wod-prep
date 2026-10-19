import { z } from "zod";
import { ReferenceArticlesSchema } from "@/schemas/articles";
import { ClassPrepSchema } from "@/schemas/classPrep";
import { ReferenceVideosSchema } from "@/schemas/videos";
import { MovementSchema, WorkoutPartSchema } from "@/schemas/wod";
import type { SavedWod, WodState } from "@/types/wod";

/** Validates a WOD restored from storage, so stale or tampered data is dropped instead of crashing. */
export const WodStateSchema: z.ZodType<WodState> = z.object({
  parts: z
    .array(
      WorkoutPartSchema.extend({
        // Optional so workouts saved before these fields existed still restore.
        minutes: WorkoutPartSchema.shape.minutes.optional(),
        equipment: WorkoutPartSchema.shape.equipment.optional(),
        id: z.string(),
        originalStimulus: z.string(),
        videos: ReferenceVideosSchema.optional(),
        articles: ReferenceArticlesSchema.optional(),
        movements: z.array(
          MovementSchema.extend({ id: z.string(), videos: ReferenceVideosSchema.optional() }),
        ),
      }),
    )
    .min(1),
  prep: z.object({ key: z.string(), plan: ClassPrepSchema }).optional(),
});

/** A saved WOD together with the text it was parsed from. */
export const SavedWodSchema: z.ZodType<SavedWod> = z.object({
  text: z.string(),
  wod: WodStateSchema,
});
