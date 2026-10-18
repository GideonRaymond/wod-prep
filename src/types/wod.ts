import type { Movement, WorkoutPart } from "@/schemas/wod";

/** An article about a whole workout part, shown under "Read" in Before class. */
export type ReferenceArticle = { title: string; url: string; source?: string; minutes?: number };

/** A reference video for one movement, shown under "Watch" in Before class. Links only, no thumbnails. */
export type ReferenceVideo = { title: string; url: string; duration?: string };

/** A movement in the UI, with a stable id for keys and edits. */
export type MovementItem = Movement & {
  id: string;
  /** Reference videos for this movement, once they're found (not parsed from the WOD). */
  videos?: ReferenceVideo[];
};

/** One part of a parsed WOD as held in UI state. */
export type WorkoutPartState = Omit<WorkoutPart, "movements"> & {
  id: string;
  /** The stimulus description as parsed, to revert edits to. */
  originalStimulus: string;
  movements: MovementItem[];
  /** Articles for this part, once they're found (not parsed from the WOD). */
  articles?: ReferenceArticle[];
};

/** A parsed WOD as held in UI state. */
export type WodState = { parts: WorkoutPartState[] };

/** The current WOD and the text it was parsed from, as kept across refreshes. */
export type SavedWod = { text: string; wod: WodState };
