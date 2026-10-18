import type { WorkoutPartState } from "@/types/wod";
import { pickVideos } from "./pickVideos";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** "3 videos · 1 article" for a part's reference material, or "" when it has none. */
export function referenceCounts(part: WorkoutPartState) {
  const videos = pickVideos(part).length;
  const articles = part.articles?.length ?? 0;
  return [videos && plural(videos, "video"), articles && plural(articles, "article")]
    .filter(Boolean)
    .join(" · ");
}
