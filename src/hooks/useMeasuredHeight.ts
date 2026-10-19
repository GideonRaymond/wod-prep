import { useEffect, useState, type RefObject } from "react";

/**
 * The height of an element in px, kept up to date as its content changes, so a wrapper can
 * animate to it (height: auto can't be). Null until it's measured, and where ResizeObserver isn't
 * available.
 */
export function useMeasuredHeight(ref: RefObject<HTMLElement | null>) {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setHeight(element.scrollHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return height;
}
