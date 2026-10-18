import { cn } from "@/utils/cn";

/** Shared look for text inputs, textareas and selects. */
export function fieldClass(invalid: boolean) {
  return cn(
    "w-full border bg-white text-sm focus:outline-none dark:bg-zinc-900",
    invalid
      ? "border-red-500 focus:border-red-600"
      : "border-zinc-300 focus:border-zinc-500 dark:border-zinc-700",
  );
}
