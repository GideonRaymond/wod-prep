/** A word for an intensity on the 1-10 scale. */
export function describeIntensity(intensity: number) {
  if (intensity <= 3) return "Easy";
  if (intensity <= 6) return "Moderate";
  if (intensity <= 8) return "Hard";
  return "All-out";
}
