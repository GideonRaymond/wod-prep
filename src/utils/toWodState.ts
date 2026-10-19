import type { Wod } from "@/schemas/wod";
import type { WodState } from "@/types/wod";
import { partKey } from "./partKey";
import { withId } from "./withId";

/**
 * Prepares a parsed WOD for the UI: ids on every part and movement, the original stimulus, and
 * what each part was when parsed (so edits can be spotted, and its whiteboard redrawn).
 */
export function toWodState(wod: Wod): WodState {
  return {
    parts: wod.parts.map((part) => {
      const key = partKey(part);
      return withId({
        ...part,
        originalStimulus: part.stimulus.description,
        originalIntensity: part.stimulus.intensity,
        parsedKey: key,
        boardKey: key,
        movements: part.movements.map(withId),
      });
    }),
  };
}
