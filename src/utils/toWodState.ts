import type { Wod } from "@/schemas/wod";
import type { WodState } from "@/types/wod";
import { partKey } from "./partKey";
import { withId } from "./withId";

/**
 * Prepares a parsed WOD for the UI: ids on every part and movement, the original stimulus, and
 * what each part was when parsed (so edits can be spotted).
 */
export function toWodState(wod: Wod): WodState {
  return {
    parts: wod.parts.map((part) => {
      return withId({
        ...part,
        originalStimulus: part.stimulus.description,
        originalIntensity: part.stimulus.intensity,
        parsedKey: partKey(part),
        movements: part.movements.map(withId),
      });
    }),
  };
}
