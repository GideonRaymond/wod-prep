import { twMerge } from "tailwind-merge";

/** Joins class names, letting later Tailwind classes override earlier conflicting ones. */
export function cn(...classes: (string | false | null | undefined)[]) {
  return twMerge(classes.filter(Boolean).join(" "));
}
