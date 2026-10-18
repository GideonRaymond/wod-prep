import { z } from "zod";

/** A reference video for one movement, shown under "Watch" in Before class. Links only, no thumbnails. */
export const ReferenceVideoSchema = z.object({
  title: z.string(),
  url: z.string(),
  duration: z.string().optional(),
});

export const ReferenceVideosSchema = z.array(ReferenceVideoSchema);

export type ReferenceVideo = z.infer<typeof ReferenceVideoSchema>;
