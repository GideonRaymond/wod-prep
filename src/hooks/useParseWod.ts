import { useCallback, useState } from "react";
import { requestParseWod } from "@/services/wodApi";
import type { WodState } from "@/types/wod";
import { withId } from "@/utils/withId";

/** Parses WOD text through the API and holds the result, loading and error state. */
export function useParseWod() {
  const [wod, setWod] = useState<WodState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const parse = useCallback(async (text: string) => {
    setLoading(true);
    setError(null);
    setWod(null);
    try {
      const parsed = await requestParseWod(text);
      setWod({
        parts: parsed.parts.map((part) =>
          withId({ ...part, movements: part.movements.map(withId) }),
        ),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { wod, setWod, error, loading, parse };
}
