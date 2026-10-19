import { useCallback, useState } from "react";
import { useWod } from "@/providers/WodProvider";
import type { PartOutline } from "@/schemas/wod";
import { requestParseWod } from "@/services/wodApi";
import { toWodState } from "@/utils/toWodState";

/** How far a parse has got: the structure once it's read, and which parts are read since. */
export type ParseProgress = { outline: PartOutline[] | null; read: ReadonlySet<number> };

const NO_PROGRESS: ParseProgress = { outline: null, read: new Set() };

/**
 * Parses WOD text through the API into the shared WOD state, with loading and error state.
 * `progress` follows the streamed parse: the parts as soon as they're found, then each one as
 * it's read. `parsedText` is the text of the current WOD (kept across refreshes), so the form can
 * show it and skip re-parsing it. `parse` resolves to whether it worked.
 */
export function useParseWod() {
  const { wod, setWod, loadWod, sourceText, restored } = useWod();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ParseProgress>(NO_PROGRESS);

  const parse = useCallback(
    async (text: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      setProgress(NO_PROGRESS);
      setWod(null);
      try {
        const parsed = await requestParseWod(text, {
          onOutline: (outline) => setProgress({ outline, read: new Set() }),
          onPart: (index) =>
            setProgress((prev) => ({ ...prev, read: new Set(prev.read).add(index) })),
        });
        loadWod(text, toWodState(parsed));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setWod, loadWod],
  );

  return { wod, setWod, error, loading, progress, parsedText: sourceText, restored, parse };
}
