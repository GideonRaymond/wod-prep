import type { WodState } from "@/types/wod";
import type { WaitingReference } from "@/components/workout/WhileYouWait";

/** How many references to show under the chalkboard while the class builds. */
export const WAITING_REFERENCES = 3;

/**
 * Something to watch or read while the class builds, from what's already found: the named
 * workouts' own videos first, then each movement's first video, then any articles (they take the
 * longest to find). Each link once, at most `limit`.
 */
export function waitingReferences(wod: WodState, limit = WAITING_REFERENCES): WaitingReference[] {
  const workoutVideos = wod.parts.flatMap((part) =>
    part.named
      ? (part.videos ?? []).slice(0, 1).map((video) => ({ video, about: part.title }))
      : [],
  );
  const movementVideos = wod.parts.flatMap((part) =>
    part.movements.flatMap((m) =>
      (m.videos ?? []).slice(0, 1).map((video) => ({ video, about: m.name })),
    ),
  );
  const references: WaitingReference[] = [
    ...[...workoutVideos, ...movementVideos].map(({ video, about }) => ({
      kind: "video" as const,
      title: video.title,
      url: video.url,
      meta: ["Video", video.duration, about].filter((x): x is string => Boolean(x)),
    })),
    ...wod.parts.flatMap((part) =>
      (part.articles ?? []).map((article) => ({
        kind: "article" as const,
        title: article.title,
        url: article.url,
        meta: [
          "Article",
          article.source,
          article.minutes ? `${article.minutes} min read` : undefined,
        ].filter((x): x is string => Boolean(x)),
      })),
    ),
  ];
  const seen = new Set<string>();
  return references.filter((r) => !seen.has(r.url) && seen.add(r.url)).slice(0, limit);
}
