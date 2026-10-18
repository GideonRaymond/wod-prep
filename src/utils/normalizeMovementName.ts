/**
 * Reduces a movement name to a comparison key: case, spaces, punctuation and a trailing
 * plural "s" are ignored, so "Pull-ups", "pull up" and "Pullup" all match.
 */
export function normalizeMovementName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/s$/, "");
}
