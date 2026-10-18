import type { ReferenceVideo } from "@/schemas/videos";
import type { Movement, WorkoutPart } from "@/schemas/wod";

export type { ReferenceVideo };

/** An article about a workout part, shown under "Read" in Before class. */
export type ReferenceArticle = { title: string; url: string; source?: string; minutes?: number };

/** A movement in the UI, with a stable id for keys and edits. */
export type MovementItem = Movement & {
  id: string;
  /** Reference videos for this movement, once they're found; the first is its Watch link. */
  videos?: ReferenceVideo[];
};

/** One part of a parsed WOD as held in UI state. */
export type WorkoutPartState = Omit<WorkoutPart, "movements" | "minutes" | "equipment"> & {
  /** How long the part takes in class; missing on workouts saved before it was parsed. */
  minutes?: number | null;
  /** What members need for the part; missing on workouts saved before it was parsed. */
  equipment?: string[];
  id: string;
  /** The stimulus description as parsed, to revert edits to. */
  originalStimulus: string;
  movements: MovementItem[];
  /** Videos about this part as a whole, for named workouts like "Fran", shown in Before class. */
  videos?: ReferenceVideo[];
  /** Articles for this part, once they're found (not parsed from the WOD). */
  articles?: ReferenceArticle[];
};

/** A parsed WOD as held in UI state. */
export type WodState = { parts: WorkoutPartState[] };

/** The current WOD and the text it was parsed from, as kept across refreshes. */
export type SavedWod = { text: string; wod: WodState };
