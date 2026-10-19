import { z } from "zod";
import { MAX_MOVEMENT_NAME_LENGTH } from "@/constants/wod";
import { WorkoutPartSchema } from "@/schemas/wod";

/**
 * What an article helps with: why or how a movement works, the energy system or recovery the
 * workout depends on, or a surprising but real connection to it.
 */
export const ARTICLE_ANGLES = ["mechanics", "energy", "tie-in"] as const;
export type ArticleAngle = (typeof ARTICLE_ANGLES)[number];

/** An article about a whole workout part, shown under "Read" in Before class. */
export const ReferenceArticleSchema = z.object({
  title: z.string(),
  url: z.string(),
  /** The site or publication, e.g. "CrossFit Journal". */
  source: z.string().optional(),
  /** Estimated reading time. */
  minutes: z.number().optional(),
  angle: z.enum(ARTICLE_ANGLES).optional(),
  /** Why it's worth reading before this workout, when Claude picked it. */
  reason: z.string().optional(),
  /** Needs a login to read, like most of the CrossFit Journal. */
  members: z.boolean().optional(),
});

export const ReferenceArticlesSchema = z.array(ReferenceArticleSchema);

export type ReferenceArticle = z.infer<typeof ReferenceArticleSchema>;

const text = (max: number) => z.string().trim().max(max);

/** The parts of a workout part the articles search needs, as sent to /api/articles. */
export const ArticleRequestSchema = z.object({
  title: text(120).min(1),
  named: z.boolean(),
  format: WorkoutPartSchema.shape.format,
  rounds: text(200).nullable(),
  duration: text(200).nullable(),
  movements: z
    .array(
      z.object({
        name: text(MAX_MOVEMENT_NAME_LENGTH).min(1),
        reps: text(200).nullable(),
        load: text(200).nullable(),
      }),
    )
    .min(1)
    .max(30),
  stimulus: text(1000),
  intensity: z.number().int().min(1).max(10),
});

export type ArticleRequest = z.infer<typeof ArticleRequestSchema>;
