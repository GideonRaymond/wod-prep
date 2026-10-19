import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

export type StageMarkerProps = {
  /** An icon for stages like Before class or Warm-up. */
  icon?: LucideIcon;
  /** A part label ("A", "WOD") for workout parts; shown as a solid purple pill. */
  label?: string | null;
  size?: "md" | "sm";
};

/** The round marker for a class stage, on the rail and in the briefing. */
export function StageMarker({ icon: Icon, label, size = "md" }: StageMarkerProps) {
  const box = size === "md" ? "h-8 min-w-8" : "h-6 min-w-6";
  if (Icon) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
          box,
        )}
      >
        <Icon size={size === "md" ? 16 : 14} aria-hidden />
      </span>
    );
  }
  if (label) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-purple-600 px-2 font-semibold text-white dark:bg-purple-400 dark:text-purple-950",
          box,
          size === "md" ? "text-sm" : "px-1.5 text-xs",
        )}
      >
        {label}
      </span>
    );
  }
  return <span className="mt-2.5 size-3 rounded-full bg-purple-600 dark:bg-purple-400" />;
}
