"use client";

import { useEffect, useEffectEvent, useId } from "react";
import { AddMovementForm } from "@/components/review/AddMovementForm";
import { MovementCard } from "@/components/review/MovementCard";
import { StimulusCard } from "@/components/review/StimulusCard";
import { Badge } from "@/components/shared/Badge";
import { FORMAT_LABELS } from "@/constants/wod";
import { useUndoableText } from "@/hooks/useUndoableText";
import type { Movement } from "@/schemas/wod";
import type { MovementItem, WorkoutPartState } from "@/types/wod";
import { withId } from "@/utils/withId";

export type WorkoutPartProps = {
  part: WorkoutPartState;
  onChange: (part: WorkoutPartState) => void;
};

export function WorkoutPart({ part, onChange }: WorkoutPartProps) {
  const headingId = useId();
  const meta = [FORMAT_LABELS[part.format], part.rounds, part.duration].filter(Boolean);
  const stimulus = useUndoableText(part.stimulus.description);

  // Keep the shared WOD in step with stimulus edits, so confirming uses the edited text.
  const syncStimulus = useEffectEvent((description: string) => {
    if (description === part.stimulus.description) return;
    onChange({ ...part, stimulus: { ...part.stimulus, description } });
  });
  useEffect(() => syncStimulus(stimulus.value), [stimulus.value]);

  const remove = (id: string) =>
    onChange({ ...part, movements: part.movements.filter((m) => m.id !== id) });
  const add = (movement: Movement) =>
    onChange({ ...part, movements: [...part.movements, withId(movement)] });
  const replace = (id: string, movement: MovementItem) =>
    onChange({ ...part, movements: part.movements.map((m) => (m.id === id ? movement : m)) });

  return (
    <section aria-labelledby={headingId}>
      <div className="flex items-center gap-2">
        {part.label && (
          <Badge className="bg-purple-600 text-sm font-semibold text-white dark:bg-purple-400 dark:text-purple-950">
            {part.label}
          </Badge>
        )}
        <h2 id={headingId} className="text-2xl font-semibold">
          {part.title}
        </h2>
      </div>
      <p className="text-zinc-600 dark:text-zinc-400">{meta.join(" · ")}</p>
      {part.notes && <p className="text-subtle mt-1 text-sm">{part.notes}</p>}

      <StimulusCard
        original={part.originalStimulus}
        intensity={part.stimulus.intensity}
        stimulus={stimulus}
      />

      <ul className="mt-4 space-y-3">
        {part.movements.map((m) => (
          <MovementCard key={m.id} movement={m} onRemove={() => remove(m.id)} />
        ))}
      </ul>

      <AddMovementForm movements={part.movements} onAdd={add} onMerge={replace} />
    </section>
  );
}
