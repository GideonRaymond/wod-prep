import type { ArticleRequest, ReferenceArticle } from "@/schemas/articles";
import type { WorkoutPartState } from "@/types/wod";

/** The parts of a workout part the articles search uses. */
export function toArticleRequest(part: WorkoutPartState): ArticleRequest {
  return {
    title: part.title,
    named: part.named,
    format: part.format,
    rounds: part.rounds,
    duration: part.duration,
    movements: part.movements.map(({ name, reps, load }) => ({ name, reps, load })),
    stimulus: part.stimulus.description,
    intensity: part.stimulus.intensity,
  };
}

/** Identifies what a part's articles were found for, so edits to it find new ones. */
export const articlesKey = (part: WorkoutPartState) => JSON.stringify(toArticleRequest(part));

/** Finds articles to read before a workout part. Throws an Error with a user-facing message. */
export async function requestArticles(part: WorkoutPartState): Promise<ReferenceArticle[]> {
  const res = await fetch("/api/articles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ part: toArticleRequest(part) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
  return data.articles;
}
