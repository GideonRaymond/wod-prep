import { useEffect, useRef, useState } from "react";
import { useWod } from "@/providers/WodProvider";
import { articlesKey, requestArticles } from "@/services/articlesApi";
import type { WodState, WorkoutPartState } from "@/types/wod";

/**
 * Finds articles to read before each part of the current WOD, and stores them on the part with
 * what they were found for, so they're kept across refreshes and shown in Before class. A part is
 * searched when it has none yet, or again once it's edited (its stimulus, intensity or movements),
 * since the coach's stimulus steers what's worth reading. Parts without movements are skipped. A
 * part that gets no articles keeps an empty list, so it isn't searched again.
 *
 * `loading` is true while any part is still waiting; `error` is the first failure. Failed parts
 * aren't retried until the page is opened again.
 */
export function useArticles() {
  const { wod, setWod } = useWod();
  // Searches in flight (or failed), by part and what it was searched for, so re-renders don't
  // request them again.
  const requested = useRef(new Set<string>());
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const loading = (wod ? partsToSearch(wod) : []).some((part) => !failed.has(searchKey(part)));

  useEffect(() => {
    if (!wod) return;
    for (const part of partsToSearch(wod)) {
      const search = searchKey(part);
      if (requested.current.has(search)) continue;
      requested.current.add(search);
      const key = articlesKey(part);
      requestArticles(part)
        .then((articles) => {
          requested.current.delete(search);
          // Only if the part hasn't been edited again in the meantime.
          setWod(
            (current) =>
              current && {
                ...current,
                parts: current.parts.map((p) =>
                  p.id === part.id && articlesKey(p) === key
                    ? { ...p, articles, articlesKey: key }
                    : p,
                ),
              },
          );
        })
        .catch((err: unknown) => {
          setFailed((prev) => new Set(prev).add(search));
          setError(
            (prev) => prev ?? (err instanceof Error ? err.message : "Couldn't find reading."),
          );
        });
    }
  }, [wod, setWod]);

  return { loading, error };
}

const searchKey = (part: WorkoutPartState) => `${part.id}|${articlesKey(part)}`;

/** Parts with no articles yet, or with articles found for the part before it was edited. */
function partsToSearch(wod: WodState) {
  return wod.parts.filter(
    (part) =>
      part.movements.length > 0 &&
      (!part.articles ||
        // Saved before this was kept: keep the articles it has.
        (part.articlesKey !== undefined && part.articlesKey !== articlesKey(part))),
  );
}
