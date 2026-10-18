import { useEffect, useRef, useState } from "react";
import { useWod } from "@/providers/WodProvider";
import { requestMovementVideos } from "@/services/videosApi";
import type { ReferenceVideo } from "@/schemas/videos";
import type { WodState } from "@/types/wod";
import { normalizeMovementName } from "@/utils/normalizeMovementName";

/**
 * Finds reference videos for every movement in the current WOD that doesn't have any yet, and
 * stores them on the movements, so they're kept across refreshes and shown in Before class.
 * Each movement name is looked up once, even if it appears in several parts.
 *
 * `loading` is true while any movement is still waiting for videos; `error` is the first failure.
 * Failed names aren't retried until the page is opened again.
 */
export function useMovementVideos() {
  const { wod, setWod } = useWod();
  // Names with a request in flight (or failed), so re-renders don't request them again.
  const requested = useRef(new Set<string>());
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const missing = wod ? namesWithoutVideos(wod) : new Map<string, string>();
  const loading = [...missing.keys()].some((key) => !failed.has(key));

  useEffect(() => {
    if (!wod) return;
    for (const [key, name] of namesWithoutVideos(wod)) {
      if (requested.current.has(key)) continue;
      requested.current.add(key);
      requestMovementVideos(name)
        .then((videos) => {
          requested.current.delete(key);
          setWod((current) => current && withVideos(current, key, videos));
        })
        .catch((err: unknown) => {
          setFailed((prev) => new Set(prev).add(key));
          setError(
            (prev) => prev ?? (err instanceof Error ? err.message : "Couldn't load videos."),
          );
        });
    }
  }, [wod, setWod]);

  return { loading, error };
}

/** Movement names (by normalized key) that don't have videos yet. */
function namesWithoutVideos(wod: WodState) {
  const names = new Map<string, string>();
  for (const part of wod.parts) {
    for (const movement of part.movements) {
      const key = normalizeMovementName(movement.name);
      if (!movement.videos && !names.has(key)) names.set(key, movement.name);
    }
  }
  return names;
}

function withVideos(wod: WodState, key: string, videos: ReferenceVideo[]): WodState {
  return {
    parts: wod.parts.map((part) => ({
      ...part,
      movements: part.movements.map((movement) =>
        !movement.videos && normalizeMovementName(movement.name) === key
          ? { ...movement, videos }
          : movement,
      ),
    })),
  };
}
