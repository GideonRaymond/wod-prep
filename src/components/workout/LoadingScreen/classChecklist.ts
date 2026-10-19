import { BookOpen, ClipboardList, Dumbbell, Flame, PenLine, Snowflake } from "lucide-react";
import type { ChecklistItem, ChecklistState } from "@/components/shared/Checklist";
import { beforeClassReferences } from "@/components/workout/BeforeClass";
import { videoSearchKey } from "@/hooks/useMovementVideos";
import type { ClassPrep } from "@/schemas/classPrep";
import type { WodState, WorkoutPartState } from "@/types/wod";
import {
  classEnd,
  isPlannedPart,
  planClass,
  skillMinutes,
  stageKind,
  type PlannedStage,
} from "@/utils/classPlan";
import { classStretches } from "@/utils/suggestStretches";

/** What's loaded for the class so far, as the hooks on the workout page report it. */
export type ClassProgress = {
  wod: WodState;
  prep: ClassPrep | null;
  prepLoading: boolean;
  /** Edited parts are having their whiteboard redrawn. */
  boardLoading?: boolean;
  articlesLoading: boolean;
  /** Video searches still waiting (see videoSearchKey). */
  videosPending: ReadonlySet<string>;
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** "12 min · Rower, Resistance band", from whatever is known. */
const describe = (minutes: number | null | undefined, equipment: string[] = []) =>
  [minutes ? `${minutes} min` : null, equipment.join(", ")].filter(Boolean).join(" · ");

const stateOf = (working: boolean): ChecklistState => (working ? "working" : "done");

/**
 * The loading screen's checklist: the structure every class has (reading the workout, Before
 * class, Warm-up, Workout, Cool-down), a Whiteboard step when edits are being redrawn, with the Workout row grown into this workout's own parts
 * and skills in class order, and a last "Timing the class" step once everything else is done.
 * `ready` is true once that last step is.
 */
export function classChecklist(progress: ClassProgress): {
  items: ChecklistItem[];
  ready: boolean;
} {
  const { wod, prep, prepLoading, boardLoading = false, articlesLoading, videosPending } = progress;
  const plan = planClass(wod, prep);
  const partsOf = (kind: ReturnType<typeof stageKind>) =>
    wod.parts.filter((part) => stageKind(part) === kind);
  const single = wod.parts.length === 1;

  const reading: ChecklistItem = {
    id: "reading",
    name: "Reading your workout",
    icon: ClipboardList,
    state: "done",
    meta: `${plural(wod.parts.length, "block")} found`,
  };

  // Shown while edited parts are redrawn, and after, once any part's board was.
  const redrawn = wod.parts.some((part) => part.parsedKey && part.boardKey !== part.parsedKey);
  const board: ChecklistItem[] =
    boardLoading || redrawn
      ? [
          {
            id: "board",
            name: "Whiteboard",
            icon: PenLine,
            state: stateOf(boardLoading),
            meta: boardLoading ? "Redrawing it with your changes" : "Redrawn with your changes",
          },
        ]
      : [];

  const namedVideosPending = wod.parts.some(
    (part) => part.named && videosPending.has(videoSearchKey(part.title, "workout")),
  );
  const { articles, videos } = beforeClassReferences(wod.parts);
  const preWorking = articlesLoading || namedVideosPending;
  const pre: ChecklistItem = {
    id: "pre",
    name: "Before class",
    icon: BookOpen,
    state: stateOf(preWorking),
    meta: preWorking
      ? "Articles and videos"
      : [
          articles.length && plural(articles.length, "article"),
          videos.length && plural(videos.length, "video"),
        ]
          .filter(Boolean)
          .join(" · ") || "Nothing to read this time",
  };

  const [programmedWarmup] = partsOf("warmup");
  const warmup: ChecklistItem = {
    id: "warmup",
    name: "Warm-up",
    icon: Flame,
    ...(programmedWarmup
      ? { state: "done", meta: describe(programmedWarmup.minutes, programmedWarmup.equipment) }
      : prepLoading
        ? { state: "working", meta: "Planned for today's movements" }
        : prep?.warmup
          ? { state: "done", meta: describe(prep.warmup.minutes, prep.warmup.equipment) }
          : { state: "done", meta: "Not planned this time" }),
  };

  const children = plan.flatMap((stage): ChecklistItem[] => {
    if (stage.kind === "skill") {
      const { skill } = stage;
      return [
        {
          id: `skill-${skill.movement}`,
          name: skill.movement,
          marker: "Skill",
          state: "done",
          meta: describe(skillMinutes(skill), skill.equipment),
        },
      ];
    }
    if (!isPlannedPart(stage) || stage.kind !== "part") return [];
    const { part } = stage;
    const working = partVideosPending(part, videosPending);
    return [
      {
        id: part.id,
        name: part.title,
        marker: single ? "WOD" : (part.label ?? undefined),
        state: stateOf(working),
        meta: working ? "Finding videos" : describe(part.minutes, part.equipment),
      },
    ];
  });
  const skills = children.filter((child) => child.marker === "Skill").length;
  const workoutWorking = prepLoading || children.some((child) => child.state !== "done");
  const workout: ChecklistItem = {
    id: "workout",
    name: "Workout",
    icon: Dumbbell,
    state: stateOf(workoutWorking),
    meta: prepLoading
      ? "Parts and skills"
      : [plural(children.length - skills, "part"), skills && plural(skills, "skill")]
          .filter(Boolean)
          .join(" · "),
    children,
  };

  const [programmedCooldown] = partsOf("cooldown");
  const stretches = classStretches(wod.parts);
  const cooldown: ChecklistItem = {
    id: "cooldown",
    name: "Cool-down",
    icon: Snowflake,
    state: "done",
    meta: programmedCooldown
      ? describe(programmedCooldown.minutes, programmedCooldown.equipment)
      : stretches.length > 0
        ? `${stretches.length} ${stretches.length === 1 ? "stretch" : "stretches"} · if time allows`
        : "If time allows",
  };

  const items = [reading, ...board, pre, warmup, workout, cooldown];
  if (items.some((item) => item.state !== "done")) return { items, ready: false };

  const timing: ChecklistItem = {
    id: "timing",
    name: "Timing the class",
    icon: ClipboardList,
    state: "done",
    meta: startTimes(plan, single, !programmedCooldown && stretches.length > 0),
  };
  return { items: [...items, timing], ready: true };
}

/** Whether any of a part's own video searches (its movements, or the workout by name) is waiting. */
function partVideosPending(part: WorkoutPartState, pending: ReadonlySet<string>) {
  return (
    (part.named && pending.has(videoSearchKey(part.title, "workout"))) ||
    part.movements.some((m) => pending.has(videoSearchKey(m.name, "movement")))
  );
}

/** "Starts: warm-up 5′ · skill 17′ · A 27′ · cool-down 54′", leaving out unknown times. */
export function startTimes(plan: PlannedStage[], single: boolean, stretchStage: boolean) {
  const names = plan.map((stage) => {
    if (stage.kind === "planned-warmup" || stage.kind === "warmup") return "warm-up";
    if (stage.kind === "skill") return "skill";
    if (stage.kind === "cooldown") return "cool-down";
    return single ? "WOD" : (stage.part.label ?? stage.part.title);
  });
  const times = plan.map((stage, i) => [names[i], stage.startsAt] as const);
  if (stretchStage) times.push(["cool-down", classEnd(plan)]);
  const known = times.filter(([, at]) => at !== null).map(([name, at]) => `${name} ${at}′`);
  return known.length > 0 ? `Starts: ${known.join(" · ")}` : "Start times unknown";
}
