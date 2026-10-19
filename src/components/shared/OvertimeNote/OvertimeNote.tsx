import { TriangleAlert } from "lucide-react";
import { CLASS_MINUTES } from "@/utils/classPlan";
import { cn } from "@/utils/cn";

export type OvertimeNoteProps = {
  /** Minutes past the class length (see classOvertime); nothing shows for 0 or unknown. */
  minutes: number | null;
  /** "planned": the class as planned; "minimum": before the warm-up is, the least it'll run over. */
  estimate?: "planned" | "minimum";
  className?: string;
};

/**
 * A heads-up under the whiteboard when the class runs longer than the time it has. The warm-up
 * and progressions are kept anyway, for a safe class, so this tells the coach what to cut instead.
 */
export function OvertimeNote({ minutes, estimate = "planned", className }: OvertimeNoteProps) {
  if (!minutes) return null;
  const over = `${minutes} min over the ${CLASS_MINUTES}-minute class`;
  return (
    <p
      className={cn(
        "flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100",
        className,
      )}
    >
      <TriangleAlert size={16} aria-hidden className="mt-0.5 shrink-0" />
      <span>
        {estimate === "minimum"
          ? `With a warm-up, this class runs at least ${over}.`
          : `This class runs ${over}.`}{" "}
        The warm-up and progressions stay in to keep everyone safe, so shorten the workout or its
        time cap to fit.
      </span>
    </p>
  );
}
