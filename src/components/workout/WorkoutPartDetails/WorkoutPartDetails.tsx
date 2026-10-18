import { useId } from "react";
import { WorkoutMovementCard } from "@/components/workout/WorkoutMovementCard";
import { Badge } from "@/components/shared/Badge";
import { Card } from "@/components/shared/Card";
import { IntensityGauge } from "@/components/shared/IntensityGauge";
import { FORMAT_LABELS } from "@/constants/wod";
import type { WorkoutPartState } from "@/types/wod";

/** One confirmed workout part: its stimulus and the details for each movement. */
export function WorkoutPartDetails({ part }: { part: WorkoutPartState }) {
  const headingId = useId();
  const meta = [FORMAT_LABELS[part.format], part.rounds, part.duration].filter(Boolean);

  return (
    <section aria-labelledby={headingId}>
      <div className="flex items-center gap-2">
        {part.label && (
          <Badge className="bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
            {part.label}
          </Badge>
        )}
        <h2 id={headingId} className="text-2xl font-semibold">
          {part.title}
        </h2>
      </div>
      <p className="text-zinc-600 dark:text-zinc-400">{meta.join(" · ")}</p>
      {part.notes && <p className="mt-1 text-sm text-zinc-500">{part.notes}</p>}

      <Card className="mt-4">
        <h3 className="text-lg font-medium">Stimulus</h3>
        <IntensityGauge value={part.stimulus.intensity} className="mt-3" />
        <p className="mt-2 text-sm whitespace-pre-line text-zinc-600 dark:text-zinc-400">
          {part.stimulus.description}
        </p>
      </Card>

      <ul className="mt-4 space-y-3">
        {part.movements.map((m) => (
          <WorkoutMovementCard key={m.id} movement={m} />
        ))}
      </ul>
    </section>
  );
}
