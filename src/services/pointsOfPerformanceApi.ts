import type { PointsOfPerformance, PointsSource } from "@/schemas/pointsOfPerformance";

export type PointsOfPerformanceResult = { points: PointsOfPerformance; source: PointsSource };

/** Fetches the points of performance for a movement. Throws an Error with a user-facing message. */
export async function requestPointsOfPerformance(name: string): Promise<PointsOfPerformanceResult> {
  const res = await fetch("/api/points-of-performance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
  return { points: data.points, source: data.source };
}
