import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

const TONES = {
  neutral: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  amber: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
  sky: "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-200",
  emerald: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200",
};

export type BadgeTone = keyof typeof TONES;

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone };

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs", TONES[tone], className)} {...props} />
  );
}
