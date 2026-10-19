import "server-only";

/** How long each kind of result takes for real, roughly: [shortest, longest] in ms. */
export const MOCK_DELAYS_MS = {
  outline: [1500, 2500],
  part: [3000, 6000],
  videos: [1000, 3500],
  points: [500, 1500],
  prep: [4000, 7000],
  board: [1500, 3000],
  articles: [8000, 14000],
} satisfies Record<string, [number, number]>;

export type MockLoadKind = keyof typeof MOCK_DELAYS_MS;

/** True when MOCK_LOAD=true: cached and hand-picked results then arrive as slowly as real ones. */
export function isMockLoad() {
  return process.env.MOCK_LOAD === "true";
}

/** A delay for one kind of result, somewhere in its usual range. */
export function mockDelayMs(kind: MockLoadKind, random = Math.random) {
  const [min, max] = MOCK_DELAYS_MS[kind];
  return Math.round(min + random() * (max - min));
}

/**
 * With MOCK_LOAD=true, waits about as long as a real result of this kind would take, so cached
 * results still show the loading screen. Does nothing otherwise.
 */
export async function mockLoad(kind: MockLoadKind) {
  if (!isMockLoad()) return;
  await new Promise((resolve) => setTimeout(resolve, mockDelayMs(kind)));
}
