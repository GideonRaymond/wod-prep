import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

const TONES = {
  neutral: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  // One purple at three strengths, so the tones differ by lightness, not hue alone.
  deep: "bg-purple-800 text-white dark:bg-purple-200 dark:text-purple-950",
  mid: "bg-purple-300 text-purple-950 dark:bg-purple-700 dark:text-white",
  pale: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
  /** A warning to heed, like a movement to avoid when pregnant. */
  caution: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
};

export type BadgeTone = keyof typeof TONES;

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone };

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs", TONES[tone], className)} {...props} />
  );
}
