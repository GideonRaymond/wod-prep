import { useEffect, useRef, useState } from "react";
import { useWod } from "@/providers/WodProvider";
import { requestBoards, toBoardPart } from "@/services/boardApi";
import { boardOutdated, partKey } from "@/utils/partKey";

/**
 * Redraws the whiteboard of every part edited since its board was drawn, and stores the new board
 * on it (so it's kept across refreshes). A part edited again in the meantime keeps waiting for
 * its own redraw.
 *
 * `loading` is true while edited parts are waiting for a board; `error` is the last failure, and
 * those parts keep their old board until the page is opened again.
 */
export function useBoardRedraw() {
  const { wod, setWod } = useWod();
  // Redraws in flight (or failed), so re-renders don't request them again.
  const requested = useRef(new Set<string>());
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const outdated = wod?.parts.filter(boardOutdated) ?? [];
  const key = outdated.length > 0 ? JSON.stringify(outdated.map(toBoardPart)) : null;
  const loading = key !== null && !failed.has(key);

  useEffect(() => {
    if (!wod || key === null || requested.current.has(key)) return;
    requested.current.add(key);
    const parts = wod.parts.filter(boardOutdated);
    requestBoards(parts)
      .then((boards) => {
        requested.current.delete(key);
        setWod((current) => {
          if (!current) return current;
          return {
            ...current,
            parts: current.parts.map((part) => {
              const i = parts.findIndex((p) => p.id === part.id);
              // Only if the part hasn't changed again since it was sent.
              if (i === -1 || partKey(part) !== partKey(parts[i])) return part;
              return { ...part, board: boards[i], boardKey: partKey(part) };
            }),
          };
        });
      })
      .catch((err: unknown) => {
        setFailed((prev) => new Set(prev).add(key));
        setError(err instanceof Error ? err.message : "Couldn't redraw the whiteboard.");
      });
  }, [wod, key, setWod]);

  return { loading, error };
}
