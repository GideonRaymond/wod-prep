import type { Movement } from "@/schemas/wod";

type Unit = { singular: string; plural: string };

const UNITS: Record<string, Unit> = {};
function defineUnit(aliases: string[], singular: string, plural = singular) {
  const unit = { singular, plural };
  for (const alias of aliases) UNITS[alias] = unit;
}
defineUnit(["", "rep", "reps"], "");
defineUnit(["mile", "miles", "mi"], "mile", "miles");
defineUnit(["m", "meter", "meters", "metre", "metres"], "m");
defineUnit(["km", "k"], "km");
defineUnit(["cal", "cals", "calorie", "calories"], "cal");

function parseAmount(reps: string) {
  const match = reps.trim().match(/^(\d+(?:\.\d+)?)\s*([a-z]*)$/i);
  if (!match) return null;
  const unit = UNITS[match[2].toLowerCase()];
  return unit ? { amount: Number(match[1]), unit } : null;
}

/** Adds up two rep counts when they're plain amounts in the same unit, e.g. "1 mile" + "1 mile". */
export function sumReps(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  const x = parseAmount(a);
  const y = parseAmount(b);
  if (!x || !y || x.unit !== y.unit) return `${a} + ${b}`;

  const total = Number((x.amount + y.amount).toFixed(2));
  const { singular, plural } = x.unit;
  if (!singular) return String(total);
  return `${total} ${total === 1 ? singular : plural}`;
}

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/s$/, "");

// Same movement at the same load counts as a duplicate; different loads stay separate.
const keyOf = (m: Movement) => `${normalize(m.name)}|${normalize(m.load ?? "")}`;

/** Whether two movements are the same movement at the same load. */
export function isSameMovement(a: Movement, b: Movement) {
  return keyOf(a) === keyOf(b);
}

/** Folds `added` into `existing`, adding up the reps. Keeps everything else (incl. ids) from `existing`. */
export function mergeMovement<T extends Movement>(existing: T, added: Movement): T {
  return {
    ...existing,
    reps: sumReps(existing.reps, added.reps),
    originalText: `${existing.originalText} · ${added.originalText}`,
  };
}

/**
 * Combines movements that appear more than once (e.g. the two runs in Murph) into a single
 * entry with the reps added up, keeping the position of the first occurrence.
 */
export function mergeDuplicateMovements(movements: Movement[]): Movement[] {
  const merged = new Map<string, Movement>();
  for (const movement of movements) {
    const key = keyOf(movement);
    const existing = merged.get(key);
    merged.set(key, existing ? mergeMovement(existing, movement) : movement);
  }
  return [...merged.values()];
}
