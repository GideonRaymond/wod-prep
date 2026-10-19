import type { ClassPrep } from "@/schemas/classPrep";
import type { BoardBlock, WorkoutPartState } from "@/types/wod";
import { stageKind } from "./classPlan";
import { classStretches } from "./suggestStretches";

const line = (name: string, dose: string | null) => (dose ? `${name} – ${dose}` : name);

/**
 * What the app adds to the whiteboard once the class is planned: the planned warm-up (unless one
 * is programmed) and the suggested stretches (unless a cool-down is), each as a block.
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
      ? {
          heading: "Warm-up",
          lines: [
            ...(planned.rounds ? [planned.rounds] : []),
            ...planned.drills.map((drill) => line(drill.name, drill.dose)),
          ],
        }
      : null;

  const stretches = programmed("cooldown") ? [] : classStretches(parts);
  const cooldown =
    stretches.length > 0
      ? { heading: "Cool-down", lines: stretches.map((s) => line(s.name, s.dose)) }
      : null;

  return { warmup, cooldown };
}
