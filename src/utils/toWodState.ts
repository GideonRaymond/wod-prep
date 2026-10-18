import type { Wod } from "@/schemas/wod";
import type { WodState } from "@/types/wod";
import { withId } from "./withId";

/** Prepares a parsed WOD for the UI: ids on every part and movement, and the original stimulus. */
export function toWodState(wod: Wod): WodState {
  return {
    parts: wod.parts.map((part) =>
      withId({
        ...part,
        originalStimulus: part.stimulus.description,
        movements: part.movements.map(withId),
      }),
    ),
  };
}
