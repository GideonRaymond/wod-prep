import type { Movement, WorkoutPart } from "@/schemas/wod";

/** A movement in the UI, with a stable id for keys and edits. */
export type MovementItem = Movement & { id: string };

/** One part of a parsed WOD as held in UI state. */
export type WorkoutPartState = Omit<WorkoutPart, "movements"> & {
  id: string;
  movements: MovementItem[];
};

/** A parsed WOD as held in UI state. */
export type WodState = { parts: WorkoutPartState[] };
