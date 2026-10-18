"use client";

import { AddMovementForm } from "@/components/home/AddMovementForm";
import { MovementCard } from "@/components/home/MovementCard";
import { StimulusCard } from "@/components/home/StimulusCard";
import { FORMAT_LABELS } from "@/constants/wod";
import { useUndoableText } from "@/hooks/useUndoableText";
import type { Movement } from "@/schemas/wod";
import type { MovementItem, WodState } from "@/types/wod";
import { withId } from "@/utils/withId";

export type WodSummaryProps = {
  wod: WodState;
  onChange: (wod: WodState) => void;
};

export function WodSummary({ wod, onChange }: WodSummaryProps) {
  const meta = [FORMAT_LABELS[wod.format], wod.rounds, wod.duration].filter(Boolean);
  const stimulus = useUndoableText(wod.stimulus);

  const remove = (id: string) =>
    onChange({ ...wod, movements: wod.movements.filter((m) => m.id !== id) });
  const add = (movement: Movement) =>
    onChange({ ...wod, movements: [...wod.movements, withId(movement)] });
  const replace = (id: string, movement: MovementItem) =>
    onChange({ ...wod, movements: wod.movements.map((m) => (m.id === id ? movement : m)) });

  return (
    <section className="mt-8">
      {wod.title && <h2 className="text-2xl font-semibold">{wod.title}</h2>}
      <p className="text-zinc-600 dark:text-zinc-400">{meta.join(" · ")}</p>
      {wod.notes && <p className="mt-1 text-sm text-zinc-500">{wod.notes}</p>}

      <StimulusCard original={wod.stimulus} stimulus={stimulus} />

      <ul className="mt-4 space-y-3">
        {wod.movements.map((m) => (
          <MovementCard key={m.id} movement={m} onRemove={() => remove(m.id)} />
        ))}
      </ul>

      <AddMovementForm movements={wod.movements} onAdd={add} onMerge={replace} />
    </section>
  );
}
