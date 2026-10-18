import { useEffect, useState } from "react";

/**
 * The class stage nearest the top of the screen, by key, for sections with ids `stage-<key>`.
 * Falls back to the first stage where IntersectionObserver isn't available.
 */
export function useCurrentStage(keys: string[]) {
  const keyList = keys.join("|");
  const [current, setCurrent] = useState<string | undefined>(keys[0]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
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

  return current;
}
