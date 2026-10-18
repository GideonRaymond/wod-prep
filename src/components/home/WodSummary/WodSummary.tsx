"use client";

import { WorkoutPart } from "@/components/home/WorkoutPart";
import type { WodState, WorkoutPartState } from "@/types/wod";

export type WodSummaryProps = {
  wod: WodState;
  onChange: (wod: WodState) => void;
};

/** All parts of a parsed WOD (A, B, cool-down, ...), one section each. */
export function WodSummary({ wod, onChange }: WodSummaryProps) {
  const update = (changed: WorkoutPartState) =>
    onChange({ parts: wod.parts.map((p) => (p.id === changed.id ? changed : p)) });

  return (
    <div className="mt-8 space-y-10">
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
