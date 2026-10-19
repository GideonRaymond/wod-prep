import { useEffect, useRef, useState } from "react";
import { useWod } from "@/providers/WodProvider";
import { requestArticles } from "@/services/articlesApi";
import type { WodState } from "@/types/wod";

/**
 * Finds articles to read before each part of the current WOD that doesn't have any yet, and
 * stores them on the part, so they're kept across refreshes and shown in Before class. Parts
 * without movements are skipped. A part that gets no articles keeps an empty list, so it isn't
 * searched again.
 *
 * `loading` is true while any part is still waiting; `error` is the first failure. Failed parts
 * aren't retried until the page is opened again.
 */
export function useArticles() {
  const { wod, setWod } = useWod();
  // Parts in flight (or failed), so re-renders don't request them again.
  const requested = useRef(new Set<string>());
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const loading = (wod ? partsWithoutArticles(wod) : []).some((part) => !failed.has(part.id));

  useEffect(() => {
    if (!wod) return;
    for (const part of partsWithoutArticles(wod)) {
      if (requested.current.has(part.id)) continue;
      requested.current.add(part.id);
      requestArticles(part)
        .then((articles) => {
          requested.current.delete(part.id);
          setWod(
            (current) =>
              current && {
                ...current,
                parts: current.parts.map((p) => (p.id === part.id ? { ...p, articles } : p)),
              },
          );
        })
        .catch((err: unknown) => {
          setFailed((prev) => new Set(prev).add(part.id));
          setError(
            (prev) => prev ?? (err instanceof Error ? err.message : "Couldn't find reading."),
          );
        });
    }
  }, [wod, setWod]);

  return { loading, error };
}

function partsWithoutArticles(wod: WodState) {
  return wod.parts.filter((part) => !part.articles && part.movements.length > 0);
}
