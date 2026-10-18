import { useEffect, useRef, useState } from "react";
import { useWod } from "@/providers/WodProvider";
import { requestMovementVideos } from "@/services/videosApi";
import type { ReferenceVideo, VideoKind } from "@/schemas/videos";
import type { WodState } from "@/types/wod";
import { normalizeMovementName } from "@/utils/normalizeMovementName";

type Search = { name: string; kind: VideoKind };

/**
 * Finds reference videos for every movement in the current WOD that doesn't have any yet, and for
 * every named part (e.g. "Fran"), and stores them on the WOD, so they're kept across refreshes and
 * shown in Before class. Each name is looked up once, even if it appears in several parts.
 *
 * `loading` is true while anything is still waiting for videos; `error` is the first failure.
 * Failed searches aren't retried until the page is opened again.
 */
export function useMovementVideos() {
  const { wod, setWod } = useWod();
  // Searches in flight (or failed), so re-renders don't request them again.
  const requested = useRef(new Set<string>());
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const missing = wod ? searchesWithoutVideos(wod) : new Map<string, Search>();
  const loading = [...missing.keys()].some((key) => !failed.has(key));

  useEffect(() => {
    if (!wod) return;
    for (const [key, { name, kind }] of searchesWithoutVideos(wod)) {
      if (requested.current.has(key)) continue;
      requested.current.add(key);
      requestMovementVideos(name, kind)
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

const keyFor = (name: string, kind: VideoKind) => `${kind}:${normalizeMovementName(name)}`;

/** Movements and named parts that don't have videos yet, by search key. */
function searchesWithoutVideos(wod: WodState) {
  const searches = new Map<string, Search>();
  const add = (name: string, kind: VideoKind) => {
    const key = keyFor(name, kind);
    if (!searches.has(key)) searches.set(key, { name, kind });
  };
  for (const part of wod.parts) {
    if (part.named && !part.videos) add(part.title, "workout");
    for (const movement of part.movements) {
      if (!movement.videos) add(movement.name, "movement");
    }
  }
  return searches;
}

function withVideos(wod: WodState, key: string, videos: ReferenceVideo[]): WodState {
  return {
    parts: wod.parts.map((part) => ({
      ...part,
      ...(part.named && !part.videos && keyFor(part.title, "workout") === key && { videos }),
      movements: part.movements.map((movement) =>
        !movement.videos && keyFor(movement.name, "movement") === key
          ? { ...movement, videos }
          : movement,
      ),
    })),
  };
}
