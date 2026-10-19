import {
  CATEGORY_AREAS,
  MOVEMENT_AREAS,
  STRETCHES,
  type Stretch,
  type StretchArea,
} from "@/data/stretches";
import type { Movement } from "@/schemas/wod";

/** How many stretches a cool-down suggests at most. */
export const STRETCHES_PER_CLASS = 5;

/** The areas a movement works: by its name when a rule knows it, otherwise by its category. */
export function movementAreas(movement: Pick<Movement, "name" | "category">): StretchArea[] {
  const name = movement.name.toLowerCase();
  return (
    MOVEMENT_AREAS.find((rule) => rule.match.test(name))?.areas ??
    CATEGORY_AREAS[movement.category] ??
    []
  );
}

/** A small seeded random generator (mulberry32), so the same workout gets the same picks. */
function seededRandom(seed: string) {
  let state = [...seed].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 2654435761), 1779033703);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Suggests cool-down stretches for the movements of a workout. The areas the movements work most
 * come first (ties in the order the movements name them); each gets one stretch, skipping areas an
 * earlier pick already covers. The stretch is chosen at random, seeded by `seed` so a workout keeps
 * its picks, favoring ones aimed at that area first and stretching more of what the workout works.
 */
export function suggestStretches(
  movements: Pick<Movement, "name" | "category">[],
  seed: string,
  count = STRETCHES_PER_CLASS,
): Stretch[] {
  const scores = new Map<StretchArea, number>();
  for (const movement of movements) {
    for (const area of movementAreas(movement)) scores.set(area, (scores.get(area) ?? 0) + 1);
  }
  // Map keys keep their insertion order, and sort is stable, so ties stay in the order named.
  const areas = [...scores.keys()].sort((a, b) => scores.get(b)! - scores.get(a)!);

  const random = seededRandom(seed);
  const picked: Stretch[] = [];
  const covered = new Set<StretchArea>();
  for (const area of areas) {
    if (picked.length >= count) break;
    if (covered.has(area)) continue;
    const options = STRETCHES.filter((s) => s.areas.includes(area) && !picked.includes(s));
    if (options.length === 0) continue;
    const weights = options.map(
      (s) => 1 + (s.areas[0] === area ? 1 : 0) + s.areas.filter((a) => scores.has(a)).length,
    );
    const stretch = pickWeighted(options, weights, random());
    picked.push(stretch);
    // Only the areas the workout works count as covered, so they aren't stretched twice.
    for (const a of stretch.areas) if (scores.has(a)) covered.add(a);
  }
  return picked;
}

/** The option a random number in [0, 1) lands on, each taking up room by its weight. */
function pickWeighted<T>(options: T[], weights: number[], random: number): T {
  let at = random * weights.reduce((sum, w) => sum + w, 0);
  for (const [i, option] of options.entries()) {
    at -= weights[i];
    if (at < 0) return option;
  }
  return options[options.length - 1];
}
