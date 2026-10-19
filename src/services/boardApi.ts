import type { BoardPart } from "@/schemas/board";
import type { WorkoutPartState } from "@/types/wod";

/** What the board redraw needs from an edited part: its old board and the part as it is now. */
export function toBoardPart(part: WorkoutPartState): BoardPart {
  return {
    board: part.board ?? [],
    label: part.label,
    title: part.title,
    format: part.format,
    rounds: part.rounds,
    duration: part.duration,
    notes: part.notes,
    movements: part.movements.map(({ name, reps, load }) => ({ name, reps, load })),
  };
}

/**
 * Redraws the whiteboard of each edited part, returning one board per part in the same order.
 * Throws an Error with a user-facing message.
 */
export async function requestBoards(parts: WorkoutPartState[]): Promise<string[][]> {
  const res = await fetch("/api/board", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parts: parts.map(toBoardPart) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
  return data.boards;
}
