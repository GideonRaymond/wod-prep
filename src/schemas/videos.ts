import { z } from "zod";

/** A reference video for one movement, shown under "Watch" in Before class. Links only, no thumbnails. */
export const ReferenceVideoSchema = z.object({
  title: z.string(),
  url: z.string(),
  duration: z.string().optional(),
  /** Why it was picked, when Claude chose it from search results. */
  reason: z.string().optional(),
});

export const ReferenceVideosSchema = z.array(ReferenceVideoSchema);

export type ReferenceVideo = z.infer<typeof ReferenceVideoSchema>;

/** What to find videos for: a single movement, or a named workout like "Fran". */
export const VIDEO_KINDS = ["movement", "workout"] as const;
export type VideoKind = (typeof VIDEO_KINDS)[number];
