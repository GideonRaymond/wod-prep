import type { MovementAlternatives } from "@/schemas/classPrep";
import { normalizeMovementName } from "./normalizeMovementName";

/**
 * The planned alternatives for a movement of the part at `part` (its index in the workout): the
 * entry with the same name, however it's spelled, or else one whose name contains it or the other
 * way round ("Strict Pull-up" for "Pull-up"). Null when the plan has none for it, like a movement
 * added after the class was planned.
 */
export function alternativesFor(
  alternatives: MovementAlternatives[] | undefined,
  part: number,
  movement: string,
): MovementAlternatives | null {
  const name = normalizeMovementName(movement);
  const ofPart = (alternatives ?? []).filter((entry) => entry.part === part);
  const key = (entry: MovementAlternatives) => normalizeMovementName(entry.movement);
  return (
    ofPart.find((entry) => key(entry) === name) ??
    ofPart.find((entry) => key(entry).includes(name) || name.includes(key(entry))) ??
    null
  );
}
