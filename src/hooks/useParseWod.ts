import { useCallback, useState } from "react";
import { useWod } from "@/providers/WodProvider";
import { requestParseWod } from "@/services/wodApi";
import { toWodState } from "@/utils/toWodState";

/** Parses WOD text through the API into the shared WOD state, with loading and error state. */
export function useParseWod() {
  const { wod, setWod } = useWod();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const parse = useCallback(
    async (text: string) => {
      setLoading(true);
      setError(null);
      setWod(null);
      try {
        setWod(toWodState(await requestParseWod(text)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    },
    [setWod],
  );

  return { wod, setWod, error, loading, parse };
}
