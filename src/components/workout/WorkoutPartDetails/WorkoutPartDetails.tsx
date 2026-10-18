"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { BeforeClass, referenceCounts } from "@/components/workout/BeforeClass";
import { WorkoutMovementCard } from "@/components/workout/WorkoutMovementCard";
import { Card } from "@/components/shared/Card";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { IntensityGauge } from "@/components/shared/IntensityGauge";
import { FORMAT_LABELS } from "@/constants/wod";
import type { WorkoutPartState } from "@/types/wod";
import { cn } from "@/utils/cn";
import { describeIntensity } from "@/utils/describeIntensity";

export type WorkoutPartDetailsProps = {
  part: WorkoutPartState;
  /** Start expanded. */
  defaultOpen?: boolean;
  /** The last part of the day: its rail stops at the label instead of running on. */
  last?: boolean;
  /** The workout's only part: its marker reads "WOD" instead of a part label. */
  only?: boolean;
};

/**
 * One confirmed workout part on a purple rail. The header folds it: collapsed it shows the
 * movements and how much reference material there is; open it shows Before class, the stimulus
 * and the details for each movement.
 */
export function WorkoutPartDetails({
  part,
  defaultOpen = false,
  last = true,
  only = false,
}: WorkoutPartDetailsProps) {
  const [open, setOpen] = useState(defaultOpen);
  const titleId = useId();
  const bodyId = useId();
  const meta = [FORMAT_LABELS[part.format], part.rounds, part.duration].filter(Boolean);
  const intensity = part.stimulus.intensity;
  const counts = referenceCounts(part);
  const marker = only ? "WOD" : part.label;

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "grid gap-x-3",
        // "WOD" is wider than a part letter; with one part there are no labels to line up with.
        only ? "grid-cols-[auto_minmax(0,1fr)]" : "grid-cols-[28px_minmax(0,1fr)]",
      )}
    >
      <div className="flex flex-col items-center" aria-hidden>
        {marker ? (
          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-purple-600 px-2 text-sm font-semibold text-white dark:bg-purple-400 dark:text-purple-950">
            {marker}
          </span>
        ) : (
          <span className="mt-2 size-3 rounded-full bg-purple-600 dark:bg-purple-400" />
        )}
        {!last && (
          <span className="mt-1 w-0.5 flex-1 rounded-full bg-purple-200 dark:bg-purple-800" />
        )}
      </div>

      <div className={cn("min-w-0", !last && "pb-8")}>
        <h2>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls={bodyId}
            className="flex w-full items-start gap-3 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 dark:focus-visible:outline-purple-400"
          >
            <span className="grid min-w-0 flex-1">
              <span id={titleId} className="text-2xl font-semibold">
                {part.title}
              </span>
              <span className="text-base font-normal text-zinc-600 dark:text-zinc-400">
                {meta.join(" · ")}
              </span>
            </span>
            <span className="mt-1 inline-flex items-baseline gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs whitespace-nowrap text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              <span className="text-foreground font-semibold">{intensity}/10</span>
              {describeIntensity(intensity)}
            </span>
            <ChevronDown
              size={20}
              aria-hidden
              className={cn(
                "mt-1.5 shrink-0 text-zinc-600 transition-transform dark:text-zinc-400",
                open && "rotate-180",
              )}
            />
          </button>
        </h2>

        {!open && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {part.movements.map((m) => (
              <CategoryBadge key={m.id} category={m.category} label={m.name} />
            ))}
            {counts && <span className="text-subtle text-xs">{counts}</span>}
          </div>
        )}

        <div id={bodyId} hidden={!open} className="mt-4 space-y-3">
          <BeforeClass part={part} />

          <Card>
            <h3 className="text-lg font-medium">Stimulus</h3>
            <IntensityGauge value={intensity} className="mt-3" />
            <p className="mt-2 text-sm whitespace-pre-line text-zinc-600 dark:text-zinc-400">
              {part.stimulus.description}
            </p>
          </Card>

          <ul className="space-y-3">
            {part.movements.map((m) => (
              <WorkoutMovementCard key={m.id} movement={m} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
