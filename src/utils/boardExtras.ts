import type { ClassPrep } from "@/schemas/classPrep";
import type { BoardBlock, WorkoutPartState } from "@/types/wod";
import { CLASS_MINUTES, classEnd, planClass, stageKind } from "./classPlan";
import { classStretches } from "./suggestStretches";

/**
 * What the app adds to the whiteboard once the class is planned, kept to one line each: the
 * planned warm-up and its length (unless one is programmed), and a cool-down with the minutes
 * left at the end of class for the suggested stretches (unless one is programmed).
 */
export function boardExtras(
  parts: WorkoutPartState[],
  prep: ClassPrep | null,
): { warmup: BoardBlock | null; cooldown: BoardBlock | null } {
  const programmed = (kind: "warmup" | "cooldown") =>
    parts.some((part) => stageKind(part) === kind);

  const planned = prep?.warmup;
  const warmup =
    planned && !programmed("warmup")
      ? { heading: `Warm-up – ${planned.minutes} min`, lines: [] }
      : null;

  const stretches = programmed("cooldown") ? [] : classStretches(parts);
  const end = classEnd(planClass({ parts }, prep));
  const left = end === null ? 0 : CLASS_MINUTES - end;
  const cooldown =
    stretches.length > 0
      ? { heading: left > 0 ? `Cool-down – ${left} min` : "Cool-down if time allows", lines: [] }
      : null;

  return { warmup, cooldown };
}
