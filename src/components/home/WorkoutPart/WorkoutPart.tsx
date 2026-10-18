"use client";

import { useId } from "react";
import { AddMovementForm } from "@/components/home/AddMovementForm";
import { MovementCard } from "@/components/home/MovementCard";
import { StimulusCard } from "@/components/home/StimulusCard";
import { Badge } from "@/components/shared/Badge";
import { FORMAT_LABELS } from "@/constants/wod";
import { useUndoableText } from "@/hooks/useUndoableText";
import type { Movement } from "@/schemas/wod";
import type { MovementItem, WorkoutPartState } from "@/types/wod";
import { withId } from "@/utils/withId";

/** "A" → "Part A"; longer labels like "Cool-down" are used as they are. */
function partName(label: string | null) {
  if (!label) return null;
  return /^[a-z]$/i.test(label) ? `Part ${label.toUpperCase()}` : label;
}

export type WorkoutPartProps = {
  part: WorkoutPartState;
  onChange: (part: WorkoutPartState) => void;
};

export function WorkoutPart({ part, onChange }: WorkoutPartProps) {
  const headingId = useId();
  const heading = [partName(part.label), part.title].filter(Boolean).join(": ");
  const meta = [FORMAT_LABELS[part.format], part.rounds, part.duration].filter(Boolean);
  const stimulus = useUndoableText(part.stimulus.description);

  const remove = (id: string) =>
    onChange({ ...part, movements: part.movements.filter((m) => m.id !== id) });
  const add = (movement: Movement) =>
    onChange({ ...part, movements: [...part.movements, withId(movement)] });
  const replace = (id: string, movement: MovementItem) =>
    onChange({ ...part, movements: part.movements.map((m) => (m.id === id ? movement : m)) });

  return (
    <section aria-labelledby={heading ? headingId : undefined}>
      {heading && (
        <div className="flex items-center gap-2">
          {part.label && (
            <Badge className="bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
              {part.label}
            </Badge>
          )}
          <h2 id={headingId} className="text-2xl font-semibold">
            {heading}
          </h2>
        </div>
      )}
      <p className="text-zinc-600 dark:text-zinc-400">{meta.join(" · ")}</p>
      {part.notes && <p className="mt-1 text-sm text-zinc-500">{part.notes}</p>}

      <StimulusCard
        original={part.stimulus.description}
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
