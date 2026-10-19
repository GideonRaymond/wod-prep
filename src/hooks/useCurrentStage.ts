import { useCallback, useEffect, useRef, useState } from "react";

/** What a person does to scroll the page themselves (not a jump's smooth scroll). */
const OWN_SCROLL = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

/**
 * The class stage nearest the top of the screen, by key, for sections with ids `stage-<key>`.
 * Falls back to the first stage where IntersectionObserver isn't available.
 *
 * `pin` makes a stage current at once, as when it's picked from the whiteboard, and keeps it so
 * while the page scrolls there, even if it can't reach the top (like the last stage). Following
 * the scroll picks up again once the person scrolls the page themselves.
 */
export function useCurrentStage(keys: string[]) {
  const keyList = keys.join("|");
  // Until a stage scrolls in or is picked, the first one is current (also when the stages only
  // arrive after the first render, as when a saved workout is read).
  const [seen, setCurrent] = useState<string | undefined>();
  const current = seen ?? keys[0];
  const pinned = useRef(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (pinned.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) setCurrent(entry.target.id.replace(/^stage-/, ""));
        }
      },
      // A stage counts as current once it reaches the top 30% of the screen.
      { rootMargin: "0px 0px -70% 0px" },
    );
    for (const key of keyList.split("|")) {
      const element = document.getElementById(`stage-${key}`);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [keyList]);

  const pin = useCallback((key: string) => {
    setCurrent(key);
    if (pinned.current) return;
    pinned.current = true;
    const release = () => {
      pinned.current = false;
      for (const type of OWN_SCROLL) window.removeEventListener(type, release, true);
    };
    // Listen from the next task on, so the click that picked the stage doesn't count.
    setTimeout(() => {
      for (const type of OWN_SCROLL) window.addEventListener(type, release, true);
    });
  }, []);

  return { current, pin };
}
