import "server-only";

/** How long each kind of result takes for real, roughly: [shortest, longest] in ms. */
export const MOCK_DELAYS_MS = {
  outline: [1500, 2500],
  part: [3000, 6000],
  videos: [1000, 3500],
  points: [500, 1500],
  prep: [4000, 7000],
  articles: [8000, 14000],
} satisfies Record<string, [number, number]>;

export type MockLoadKind = keyof typeof MOCK_DELAYS_MS;

/**
 * How long a cached or hand-picked result waits by default: much less than a real one, but in
 * the same order (the outline first, articles last), so the loading screens still tick off one
 * step at a time instead of all at once.
 */
export const PACED_DELAYS_MS = {
  outline: [500, 900],
  part: [900, 1800],
  videos: [400, 1200],
  points: [150, 400],
  prep: [1500, 2500],
  articles: [2200, 3500],
} satisfies Record<MockLoadKind, [number, number]>;

/** True when MOCK_LOAD=true: cached and hand-picked results then arrive as slowly as real ones. */
export function isMockLoad() {
  return process.env.MOCK_LOAD === "true";
}

/** The delays cached results get now: realistic with MOCK_LOAD=true, none with CACHE_PACING=off. */
function delays() {
  if (isMockLoad()) return MOCK_DELAYS_MS;
  if (process.env.CACHE_PACING === "off") return null;
  return PACED_DELAYS_MS;
}

/** A delay for one kind of result, somewhere in its range (0 when pacing is off). */
export function mockDelayMs(kind: MockLoadKind, random = Math.random) {
  const ranges = delays();
  if (!ranges) return 0;
  const [min, max] = ranges[kind];
  return Math.round(min + random() * (max - min));
}

/**
 * Waits before a cached or hand-picked result is returned, so the loading screens flow as they
 * do for a fresh one: briefly by default, about as long as a real result with MOCK_LOAD=true,
 * and not at all with CACHE_PACING=off (as in tests).
 */
export async function mockLoad(kind: MockLoadKind) {
  const ms = mockDelayMs(kind);
  if (ms > 0) await new Promise((resolve) => setTimeout(resolve, ms));
}
