import { useLayoutEffect, type RefObject } from "react";

/** Grows or shrinks a textarea to fit its content, including when the window width changes. */
export function useAutoResize(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string,
  enabled = true,
) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const fit = () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [ref, value, enabled]);
}
