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
 * Decides, once the workout is there, whether the class still needs building (show the loading
 * screen) or not (show the class). `open` hands over from the loading screen: it fades out, then
 * the class opens; with reduced motion it switches at once. Calling it again does nothing.
 */
export function useHandOver({ ready, building }: { ready: boolean; building: boolean }) {
  const [phase, setPhase] = useState<HandOverPhase>("deciding");
  // Decided during render, so the first paint is already the right screen.
  if (ready && phase === "deciding") setPhase(building ? "loading" : "class");

  useEffect(() => {
    if (phase !== "leaving") return;
    const timer = setTimeout(() => setPhase("opened"), LEAVE_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const open = useCallback(
    () =>
      setPhase((current) =>
        current !== "loading" ? current : prefersReducedMotion() ? "opened" : "leaving",
      ),
    [],
  );

  return { phase, open };
}
