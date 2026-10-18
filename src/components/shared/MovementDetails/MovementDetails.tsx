import { Dumbbell, Repeat } from "lucide-react";
import type { Movement } from "@/schemas/wod";

/** The reps and load of a movement with icons, or its original text if it has neither. */
export function MovementDetails({ movement }: { movement: Movement }) {
  const { reps, load, originalText } = movement;
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
      {reps && (
        <span className="flex items-center gap-1.5" title="Reps">
          <Repeat size={14} aria-hidden /> {reps}
        </span>
      )}
      {load && (
        <span className="flex items-center gap-1.5" title="Load">
          <Dumbbell size={14} aria-hidden /> {load}
        </span>
      )}
      {!reps && !load && <span>{originalText}</span>}
    </div>
  );
}
