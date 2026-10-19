import { STEP } from "@/constants/flow";
import type { WodState } from "@/types/wod";

/**
 * The furthest step of the flow that can be opened for this workout: just the first without one,
 * up to Check once there is one, and up to the class once it could be confirmed (every part has a
 * stimulus), since opening the class step does what Confirm does.
 */
export function reachableStep(wod: WodState | null) {
  if (!wod) return STEP.workout;
  return wod.parts.some((part) => !part.stimulus.description.trim()) ? STEP.review : STEP.class;
}
