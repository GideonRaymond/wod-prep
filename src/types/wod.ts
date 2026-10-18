import type { Movement, Wod } from "@/schemas/wod";

/** A movement in the UI, with a stable id for keys and edits. */
export type MovementItem = Movement & { id: string };

/** A parsed WOD as held in UI state. */
export type WodState = Omit<Wod, "movements"> & { movements: MovementItem[] };
