import type { Movement, WorkoutPart } from "@/schemas/wod";
import type { WorkoutPartState } from "@/types/wod";

type Keyed = Pick<WorkoutPart, "label" | "title" | "format" | "rounds" | "duration" | "notes"> & {
  movements: Pick<Movement, "name" | "reps" | "load">[];
};

/** What a part's whiteboard shows, so an edit to any of it can be told apart from the original. */
export function partKey(part: Keyed) {
  const { label, title, format, rounds, duration, notes, movements } = part;
  return JSON.stringify({
    label,
    title,
    format,
    rounds,
    duration,
    notes,
    movements: movements.map(({ name, reps, load }) => [name, reps, load]),
  });
}

/** True when the part has been edited since its whiteboard was drawn, so it needs redrawing. */
export const boardOutdated = (part: WorkoutPartState) =>
  Boolean(part.board && part.boardKey && part.boardKey !== partKey(part));

/** True when any part has been edited since it was parsed (its board, or its stimulus). */
export const wodEdited = (parts: WorkoutPartState[]) =>
  parts.some(
    (part) =>
      (part.parsedKey !== undefined && part.parsedKey !== partKey(part)) ||
      part.stimulus.description !== part.originalStimulus,
  );
