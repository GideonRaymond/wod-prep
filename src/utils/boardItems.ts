import type { ClassPrep } from "@/schemas/classPrep";
import type { BoardItem, WorkoutPartState } from "@/types/wod";
import {
  CLASS_MINUTES,
  classEnd,
  isPlannedPart,
  planClass,
  skillMinutes,
  stageKind,
} from "./classPlan";
import { classStretches } from "./suggestStretches";

/** What the board needs from a part: its whiteboard lines, or else its own text. */
export type BoardSource = Pick<WorkoutPartState, "named" | "sourceText" | "board"> & {
  id?: string;
};

/** "WOD" heads the board when no part has a real name (like "Fran"). */
export const boardTitle = (parts: Pick<BoardSource, "named">[]) =>
  parts.some((part) => part.named) ? null : "WOD";

/** A part's block: its whiteboard lines, or its own text for older saved workouts. */
function partItem(part: BoardSource, key: string): BoardItem {
  const lines = part.board?.length ? part.board : part.sourceText.split("\n");
  const [heading = "", ...rest] = lines.map((line) => line.trim()).filter(Boolean);
  return { key, heading, lines: rest };
}

/** The workout as written, part by part (while it's read, and while it's checked). */
export function partsBoard(parts: BoardSource[]) {
  return {
    items: parts.map((part, i) => partItem(part, part.id ?? `part-${i}`)),
    title: boardTitle(parts),
  };
}

/**
 * The board for the class, in class order: the planned warm-up, each skill practice right before
 * the part that uses it, the parts, and a cool-down for the suggested stretches when none is
 * programmed. The app's own blocks are one line each, their name and length; the cool-down gets
 * the minutes left at the end of class. Keys are the class page's stage keys.
 */
export function classBoard(parts: WorkoutPartState[], prep: ClassPrep | null) {
  const plan = planClass({ parts }, prep);
  const programmed = (kind: "warmup" | "cooldown") =>
    parts.some((part) => stageKind(part) === kind);
  // A programmed warm-up replaces the planned one (the planner leaves it out too).
  const stages = plan.filter((stage) => !(stage.kind === "planned-warmup" && programmed("warmup")));
  const items: BoardItem[] = stages.map((stage) => {
    if (isPlannedPart(stage)) return partItem(stage.part, stage.part.id);
    if (stage.kind === "planned-warmup") {
      return added("planned-warmup", `Warm-up – ${stage.warmup.minutes} min`);
    }
    const { skill } = stage;
    return added(
      `skill-${skill.movement}`,
      `Skill: ${skill.movement} – ${skillMinutes(skill)} min`,
    );
  });

  if (!programmed("cooldown") && classStretches(parts).length > 0) {
    const end = classEnd(plan);
    const left = end === null ? 0 : CLASS_MINUTES - end;
    items.push(
      added("stretches", left > 0 ? `Cool-down – ${left} min` : "Cool-down if time allows"),
    );
  }
  return { items, title: boardTitle(parts) };
}

const added = (key: string, heading: string): BoardItem => ({
  key,
  heading,
  lines: [],
  added: true,
});
