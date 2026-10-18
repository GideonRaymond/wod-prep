import { useCallback, useState } from "react";
import { useWod } from "@/providers/WodProvider";
import { requestParseWod } from "@/services/wodApi";
import { toWodState } from "@/utils/toWodState";

/**
 * Parses WOD text through the API into the shared WOD state, with loading and error state.
 * `parsedText` is the text of the last successful parse, so the form can skip re-parsing it.
 */
export function useParseWod() {
  const { wod, setWod } = useWod();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsedText, setParsedText] = useState<string | null>(null);

  const parse = useCallback(
    async (text: string) => {
      setLoading(true);
      setError(null);
      setWod(null);
      setParsedText(null);
      try {
        setWod(toWodState(await requestParseWod(text)));
        setParsedText(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    },
    [setWod],
  );

  return { wod, setWod, error, loading, parsedText, parse };
}
