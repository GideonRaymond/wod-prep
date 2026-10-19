import type { ReferenceArticle } from "@/schemas/articles";
import type { ClassPrep } from "@/schemas/classPrep";
import type { ReferenceVideo } from "@/schemas/videos";
import type { Movement, WorkoutPart } from "@/schemas/wod";

export type { ReferenceArticle, ReferenceVideo };

/** A movement in the UI, with a stable id for keys and edits. */
export type MovementItem = Movement & {
  id: string;
  /** Reference videos for this movement, once they're found; the first is its Watch link. */
  videos?: ReferenceVideo[];
};

/** One part of a parsed WOD as held in UI state. */
export type WorkoutPartState = Omit<
  WorkoutPart,
  "movements" | "minutes" | "equipment" | "board"
> & {
  /** How long the part takes in class; missing on workouts saved before it was parsed. */
  minutes?: number | null;
  /** What members need for the part; missing on workouts saved before it was parsed. */
  equipment?: string[];
  /** The whiteboard lines; missing on workouts saved before they were written (see WodBoard). */
  board?: string[];
  /** What the part was when parsed and when its board was drawn (see partKey). */
  parsedKey?: string;
  boardKey?: string;
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
export type WodState = {
  parts: WorkoutPartState[];
  /** The planned warm-up and skill practice, with the workout it was planned for (see prepKey). */
  prep?: { key: string; plan: ClassPrep };
};

/** The current WOD and the text it was parsed from, as kept across refreshes. */
export type SavedWod = { text: string; wod: WodState };

/**
 * One block on the whiteboard: a heading in marker and lines in handwriting. `key` is the class
 * stage it stands for (see WorkoutPage), so the board can link to it. `added` blocks are the app's
 * own (the planned warm-up, skill practice, suggested stretches), written in another ink.
 */
export type BoardItem = { key: string; heading: string; lines: string[]; added?: boolean };
