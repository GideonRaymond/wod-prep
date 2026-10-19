"use client";

import { WorkoutPart } from "@/components/review/WorkoutPart";
import type { WodState, WorkoutPartState } from "@/types/wod";
import { cn } from "@/utils/cn";

export type WodSummaryProps = {
  wod: WodState;
  onChange: (wod: WodState) => void;
  className?: string;
};

/** All parts of a parsed WOD (A, B, cool-down, ...), one section each. */
export function WodSummary({ wod, onChange, className }: WodSummaryProps) {
  const update = (changed: WorkoutPartState) =>
    onChange({ ...wod, parts: wod.parts.map((p) => (p.id === changed.id ? changed : p)) });

  return (
    <div className={cn("mt-8 space-y-10", className)}>
      {wod.parts.map((part, i) => (
        <div
          key={part.id}
          className={i > 0 ? "border-t border-zinc-200 pt-10 dark:border-zinc-800" : undefined}
        >
          <WorkoutPart part={part} onChange={update} />
        </div>
      ))}
    </div>
  );
}
