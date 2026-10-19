"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { MergeMovementDialog } from "@/components/review/MergeMovementDialog";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { Select } from "@/components/shared/Select";
import { TextInput } from "@/components/shared/TextInput";
import { MAX_MOVEMENT_NAME_LENGTH, MOVEMENT_CATEGORIES } from "@/constants/wod";
import type { Movement } from "@/schemas/wod";
import type { MovementItem } from "@/types/wod";
import { isSameMovement, mergeMovement } from "@/utils/mergeDuplicateMovements";

const CATEGORY_OPTIONS = MOVEMENT_CATEGORIES.map((c) => ({ value: c, label: c }));

export type AddMovementFormProps = {
  /** Movements already in the workout, to detect duplicates. */
  movements: MovementItem[];
  onAdd: (movement: Movement) => void;
  /** Replaces the movement with this id by the merged result. */
  onMerge: (id: string, merged: MovementItem) => void;
};

export function AddMovementForm({ movements, onAdd, onMerge }: AddMovementFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [reps, setReps] = useState("");
  const [load, setLoad] = useState("");
  const [category, setCategory] = useState<Movement["category"]>("other");
  const [pending, setPending] = useState<{ existing: MovementItem; added: Movement } | null>(null);

  function reset() {
    setName("");
    setReps("");
    setLoad("");
    setCategory("other");
    setOpen(false);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const movement: Movement = {
      name: trimmed,
      originalText: trimmed,
      reps: reps.trim() || null,
      load: load.trim() || null,
      category,
    };
    const existing = movements.find((m) => isSameMovement(m, movement));
    if (existing) {
      setPending({ existing, added: movement });
      return;
    }
    onAdd(movement);
    reset();
  }

  function confirmMerge() {
    if (!pending) return;
    onMerge(pending.existing.id, mergeMovement(pending.existing, pending.added));
    setPending(null);
    reset();
  }

  if (!open) {
    return (
      <Button
        variant="dashed"
        icon={Plus}
        onClick={() => setOpen(true)}
        className="mt-3 p-3 text-sm"
      >
        Add movement
      </Button>
    );
  }

  return (
    <Card
      as="form"
      onSubmit={handleSubmit}
      className="mt-3 space-y-2 border-zinc-300 dark:border-zinc-700"
    >
      <TextInput
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Movement, e.g. Wall Balls"
        maxLength={MAX_MOVEMENT_NAME_LENGTH}
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <TextInput
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          placeholder="Reps, e.g. 15"
        />
        <TextInput
          value={load}
          onChange={(e) => setLoad(e.target.value)}
          placeholder="Load, e.g. 20/14 lb"
        />
        <Select
          aria-label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value as Movement["category"])}
          options={CATEGORY_OPTIONS}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={!name.trim()}>
          Add
        </Button>
        <Button variant="secondary" size="sm" onClick={reset}>
          Cancel
        </Button>
      </div>
      <MergeMovementDialog
        existing={pending?.existing ?? null}
        added={pending?.added ?? null}
        onMerge={confirmMerge}
        onCancel={() => setPending(null)}
      />
    </Card>
  );
}
