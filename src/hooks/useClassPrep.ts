import { useEffect, useRef, useState } from "react";
import { useWod } from "@/providers/WodProvider";
import { prepKey, requestClassPrep } from "@/services/classPrepApi";

/**
 * Plans the warm-up and skill practice for the current WOD and stores the plan on it, so it's
 * kept across refreshes. The plan remembers which workout it was made for: once the workout is
 * edited, a new plan is made.
 *
 * `loading` is true while the current workout is waiting for a plan; `error` is the last failure.
 * A failed workout isn't retried until the page is opened again.
 */
export function useClassPrep() {
  const { wod, setWod } = useWod();
  // Workouts in flight (or failed), so re-renders don't request them again.
  const requested = useRef(new Set<string>());
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const key = wod ? prepKey(wod) : null;
  const loading = key !== null && wod?.prep?.key !== key && !failed.has(key);

  useEffect(() => {
    if (!wod || key === null || wod.prep?.key === key || requested.current.has(key)) return;
    requested.current.add(key);
    requestClassPrep(wod)
      .then((plan) => {
        requested.current.delete(key);
        // Only store it if the workout hasn't changed in the meantime.
        setWod((current) =>
          current && prepKey(current) === key ? { ...current, prep: { key, plan } } : current,
        );
      })
      .catch((err: unknown) => {
        setFailed((prev) => new Set(prev).add(key));
        setError(err instanceof Error ? err.message : "Couldn't plan the warm-up.");
      });
  }, [wod, key, setWod]);

  return { loading, error, plan: wod?.prep?.key === key ? wod.prep.plan : null };
}
