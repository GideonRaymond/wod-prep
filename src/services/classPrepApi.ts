import type { ClassPrep, PrepRequest } from "@/schemas/classPrep";
import type { WodState } from "@/types/wod";

/** What the warm-up planner needs from each part of the workout. */
export function toPrepRequest(wod: WodState): PrepRequest {
  return {
    parts: wod.parts.map((part) => ({
      label: part.label,
      title: part.title,
      format: part.format,
      rounds: part.rounds,
      duration: part.duration,
      minutes: part.minutes ?? null,
      movements: part.movements.map(({ name, reps, load, category }) => ({
        name,
        reps,
        load,
        category,
      })),
      stimulus: part.stimulus.description,
      intensity: part.stimulus.intensity,
    })),
  };
}

/** Identifies the workout a plan was made for, so edits to it get a new plan. */
export const prepKey = (wod: WodState) => JSON.stringify(toPrepRequest(wod));

/** Plans the warm-up and skill practice for a workout. Throws an Error with a user-facing message. */
export async function requestClassPrep(wod: WodState): Promise<ClassPrep> {
  const res = await fetch("/api/class-prep", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toPrepRequest(wod)),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
  return data.prep;
}
