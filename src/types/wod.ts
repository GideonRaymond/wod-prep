import type { Movement, WorkoutPart } from "@/schemas/wod";

/** A movement in the UI, with a stable id for keys and edits. */
export type MovementItem = Movement & { id: string };

/** One part of a parsed WOD as held in UI state. */
export type WorkoutPartState = Omit<WorkoutPart, "movements"> & {
  id: string;
  /** The stimulus description as parsed, to revert edits to. */
  originalStimulus: string;
  movements: MovementItem[];
};

/** A parsed WOD as held in UI state. */
export type WodState = { parts: WorkoutPartState[] };

/** The current WOD and the text it was parsed from, as kept across refreshes. */
export type SavedWod = { text: string; wod: WodState };
