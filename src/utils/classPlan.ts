import type { WodState, WorkoutPartState } from "@/types/wod";

/** Minutes the coach spends on the whiteboard before the first part starts. */
export const WHITEBOARD_MINUTES = 5;

/** Where a part sits in the class: the warm-up, a workout part, or the cool-down. */
export type StageKind = "warmup" | "part" | "cooldown";

/** A part placed in the class, with the minute it starts at (null once a length is unknown). */
export type PlannedPart = { part: WorkoutPartState; kind: StageKind; startsAt: number | null };

const WARM_UP = /warm[\s-]?up/i;
const COOL_DOWN = /cool[\s-]?down|stretch|mobility/i;
const ORDER: Record<StageKind, number> = { warmup: 0, part: 1, cooldown: 2 };

/** Warm-up and cool-down are told apart by their label (e.g. "Warm-up", "Cool-down"). */
export function stageKind(part: Pick<WorkoutPartState, "label">): StageKind {
  const label = part.label ?? "";
  if (WARM_UP.test(label)) return "warmup";
  if (COOL_DOWN.test(label)) return "cooldown";
  return "part";
}

/**
 * Orders a WOD's parts as a class runs (warm-up, workout parts, cool-down; otherwise as written)
 * and works out when each starts: after the whiteboard, then one part after another. Once a part's
 * length is unknown, the parts after it get no start time.
 */
export function planClass(wod: WodState): PlannedPart[] {
  let clock: number | null = WHITEBOARD_MINUTES;
  return wod.parts
    .map((part, index) => ({ part, kind: stageKind(part), index }))
    .sort((a, b) => ORDER[a.kind] - ORDER[b.kind] || a.index - b.index)
    .map(({ part, kind }) => {
      const startsAt = clock;
      clock = clock !== null && part.minutes ? clock + part.minutes : null;
      return { part, kind, startsAt };
    });
}

/** Every piece of equipment the class needs, once each (ignoring case), in order of first use. */
export function allEquipment(parts: Pick<WorkoutPartState, "equipment">[]): string[] {
  const seen = new Set<string>();
  const items: string[] = [];
  for (const item of parts.flatMap((part) => part.equipment ?? [])) {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    items.push(item.trim());
  }
  return items;
}
