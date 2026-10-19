import { useCallback, useEffect, useState } from "react";

/**
 * Where the workout page is: deciding (no workout yet), showing the class straight away, building
 * it on the loading screen, fading the loading screen out, or showing the class it just opened.
 */
export type HandOverPhase = "deciding" | "class" | "loading" | "leaving" | "opened";

/** How long the loading screen takes to fade out. */
export const LEAVE_MS = 400;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);

/**
 * Decides, for each workout, whether its class still needs building (show the loading screen) or
 * not (show the class). `workout` identifies the workout (null while there's none), so a new or
 * edited workout is decided afresh, even though Next.js keeps this page alive between visits.
 * `open` hands over from the loading screen: it fades out, then the class opens; with reduced
 * motion it switches at once. Calling it again does nothing.
 */
export function useHandOver({ workout, building }: { workout: string | null; building: boolean }) {
  const [state, setState] = useState<{ phase: HandOverPhase; workout: string | null }>({
    phase: "deciding",
    workout: null,
  });
  // Decided during render, so the first paint is already the right screen.
  if (workout !== null && state.workout !== workout) {
    setState({ phase: building ? "loading" : "class", workout });
  }
  const phase = workout === null ? "deciding" : state.phase;

  useEffect(() => {
    if (phase !== "leaving") return;
    const timer = setTimeout(() => setState((s) => ({ ...s, phase: "opened" })), LEAVE_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const open = useCallback(
    () =>
      setState((s) =>
        s.phase !== "loading" ? s : { ...s, phase: prefersReducedMotion() ? "opened" : "leaving" },
      ),
    [],
  );

  return { phase, open };
}
