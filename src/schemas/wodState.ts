import { z } from "zod";
import { ReferenceArticlesSchema } from "@/schemas/articles";
import { ReferenceVideosSchema } from "@/schemas/videos";
import { MovementSchema, WorkoutPartSchema } from "@/schemas/wod";
import type { SavedWod, WodState } from "@/types/wod";

/** Validates a WOD restored from storage, so stale or tampered data is dropped instead of crashing. */
export const WodStateSchema: z.ZodType<WodState> = z.object({
  parts: z
    .array(
      WorkoutPartSchema.extend({
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
});

/** A saved WOD together with the text it was parsed from. */
export const SavedWodSchema: z.ZodType<SavedWod> = z.object({
  text: z.string(),
  wod: WodStateSchema,
});
