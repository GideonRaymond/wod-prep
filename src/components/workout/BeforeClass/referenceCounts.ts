import type { WorkoutPartState } from "@/types/wod";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** "3 videos · 1 article" for a part's reference material, or "" when it has none. */
export function referenceCounts(part: WorkoutPartState) {
  const videos = part.movements.reduce((n, m) => n + (m.videos?.length ?? 0), 0);
  const articles = part.articles?.length ?? 0;
  return [videos && plural(videos, "video"), articles && plural(articles, "article")]
    .filter(Boolean)
    .join(" · ");
}
