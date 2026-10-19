import type { ClassPrep, SkillBlock, WarmupPlan } from "@/schemas/classPrep";
import type { WodState, WorkoutPartState } from "@/types/wod";
import { normalizeMovementName } from "./normalizeMovementName";

/** How long a class runs. */
export const CLASS_MINUTES = 60;

/** Minutes the coach spends on the whiteboard before the first part starts. */
export const WHITEBOARD_MINUTES = 5;

/** Kept free at the end for putting equipment away and a short stretch, when no cool-down is programmed. */
export const WRAP_UP_MINUTES = 5;

/** A planned warm-up never takes less than this, however full the class is. */
export const MIN_WARMUP_MINUTES = 8;

/** Skill practice shorter than this isn't worth setting up for. */
export const MIN_SKILL_MINUTES = 5;

/** Where a part sits in the class: the warm-up, a workout part, or the cool-down. */
export type StageKind = "warmup" | "part" | "cooldown";

/** A part placed in the class, with the minute it starts at (null once a length is unknown). */
export type PlannedPart = { part: WorkoutPartState; kind: StageKind; startsAt: number | null };

/** The planned warm-up or a skill practice placed in the class. */
export type PlannedPrep =
  | { kind: "planned-warmup"; warmup: WarmupPlan; startsAt: number | null }
  | { kind: "skill"; skill: SkillBlock; startsAt: number | null };

export type PlannedStage = PlannedPart | PlannedPrep;

export const isPlannedPart = (stage: PlannedStage): stage is PlannedPart => "part" in stage;

const WARM_UP = /warm[\s-]?up/i;
const COOL_DOWN = /cool[\s-]?down|stretch|mobility/i;
const ORDER: Record<StageKind, number> = { warmup: 0, part: 1, cooldown: 2 };

/** Warm-up and cool-down are told apart by their label (e.g. "Warm-up", "Cool-down"). */
export function stageKind(part: Pick<WorkoutPartState, "label">): StageKind {
  const label = part.label ?? "";
  if (WARM_UP.test(label)) return "warmup";
  if (COOL_DOWN.test(label)) return "cooldown";
  return "part";
}

/** Class time for a skill practice: setting up plus each progression. */
export function skillMinutes(skill: SkillBlock) {
  return skill.setupMinutes + skill.progressions.reduce((sum, p) => sum + p.minutes, 0);
}

/**
 * Minutes left for a planned warm-up and skill practice: the class minus the whiteboard, every
 * part (a programmed warm-up included) and a wrap-up when no cool-down is programmed. Null when
 * a part's length is unknown. Can be zero or less when the parts fill the class.
 */
export function prepBudget(parts: Pick<WorkoutPartState, "label" | "minutes">[]): number | null {
  if (parts.some((part) => !part.minutes)) return null;
  const used = parts.reduce((sum, part) => sum + (part.minutes ?? 0), 0);
  const wrapUp = parts.some((part) => stageKind(part) === "cooldown") ? 0 : WRAP_UP_MINUTES;
  return CLASS_MINUTES - WHITEBOARD_MINUTES - used - wrapUp;
}

/**
 * Makes a planned start of class fit the time there is. The warm-up is kept (dropped when one is
 * programmed). Skills follow in order of importance: one that doesn't fit loses its last, hardest
 * progressions until it does, and is dropped when less than MIN_SKILL_MINUTES would be left.
 * With an unknown budget, the plan is kept as it is.
 */
export function fitPrep(
  prep: ClassPrep,
  budget: number | null,
  { programmedWarmup }: { programmedWarmup: boolean },
): ClassPrep {
  const warmup = programmedWarmup ? null : prep.warmup;
  if (budget === null) return { warmup, skills: prep.skills };

  let left = budget - (warmup?.minutes ?? 0);
  const skills: SkillBlock[] = [];
  for (const skill of prep.skills) {
    let fitted = skill;
    while (skillMinutes(fitted) > left && fitted.progressions.length > 1) {
      fitted = { ...fitted, progressions: fitted.progressions.slice(0, -1) };
    }
    const minutes = skillMinutes(fitted);
    if (minutes > left || minutes < MIN_SKILL_MINUTES) break;
    skills.push(fitted);
    left -= minutes;
  }
  return { warmup, skills };
}

/**
 * The workout part a skill is practiced for: the first one with a movement of that name (or one
 * containing it, like "Strict Toes-to-Bar" for "Toes-to-Bar"). Null when no part has it.
 */
export function partForSkill<T extends { movements: { name: string }[] }>(
  skill: Pick<SkillBlock, "movement">,
  parts: T[],
): T | null {
  const name = normalizeMovementName(skill.movement);
  const matches = (other: string) => {
    const key = normalizeMovementName(other);
    return key === name || key.includes(name) || name.includes(key);
  };
  return (
    parts.find((part) => part.movements.some((m) => normalizeMovementName(m.name) === name)) ??
    parts.find((part) => part.movements.some((m) => matches(m.name))) ??
    null
  );
}

/**
 * Orders the class as it runs and works out when each stage starts: after the whiteboard come a
 * programmed warm-up or the planned one, then the workout parts and the cool-down (parts of the
 * same kind as written). Each skill practice comes right before the first part that uses the
 * skill, or before the first workout part when none does. Once a stage's length is unknown, the
 * ones after it get no start time.
 */
export function planClass(wod: WodState, prep?: ClassPrep | null): PlannedStage[] {
  const parts = wod.parts
    .map((part, index) => ({ part, kind: stageKind(part), index }))
    .sort((a, b) => ORDER[a.kind] - ORDER[b.kind] || a.index - b.index);
  const warmups = parts.filter((p) => p.kind === "warmup");
  const rest = parts.filter((p) => p.kind !== "warmup");

  const workoutParts = rest.filter((p) => p.kind === "part").map((p) => p.part);
  const skillsBefore = new Map<WorkoutPartState | null, SkillBlock[]>();
  for (const skill of prep?.skills ?? []) {
    const target = partForSkill(skill, workoutParts) ?? workoutParts[0] ?? null;
    skillsBefore.set(target, [...(skillsBefore.get(target) ?? []), skill]);
  }

  let clock: number | null = WHITEBOARD_MINUTES;
  const at = (minutes: number | null) => {
    const startsAt = clock;
    clock = clock !== null && minutes ? clock + minutes : null;
    return startsAt;
  };
  const skillStages = (skills: SkillBlock[] = []): PlannedPrep[] =>
    skills.map((skill) => ({ kind: "skill", skill, startsAt: at(skillMinutes(skill)) }));
  const partStage = ({ part, kind }: { part: WorkoutPartState; kind: StageKind }): PlannedPart => ({
    part,
    kind,
    startsAt: at(part.minutes ?? null),
  });

  const stages: PlannedStage[] = warmups.map(partStage);
  if (prep?.warmup) {
    stages.push({ kind: "planned-warmup", warmup: prep.warmup, startsAt: at(prep.warmup.minutes) });
  }
  for (const planned of rest) {
    stages.push(...skillStages(skillsBefore.get(planned.part)), partStage(planned));
  }
  // Only when the workout has no parts besides a warm-up and cool-down.
  stages.push(...skillStages(skillsBefore.get(null)));
  return stages;
}

/** The minute the last stage ends, or null when a length along the way is unknown. */
export function classEnd(plan: PlannedStage[]): number | null {
  const last = plan.at(-1);
  if (!last) return WHITEBOARD_MINUTES;
  if (last.startsAt === null) return null;
  const minutes = isPlannedPart(last)
    ? last.part.minutes
    : last.kind === "planned-warmup"
      ? last.warmup.minutes
      : skillMinutes(last.skill);
  return minutes ? last.startsAt + minutes : null;
}

/** Every piece of equipment the class needs, once each (ignoring case), in order of first use. */
export function allEquipment(parts: Pick<WorkoutPartState, "equipment">[]): string[] {
  const seen = new Set<string>();
  const items: string[] = [];
  for (const item of parts.flatMap((part) => part.equipment ?? [])) {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    items.push(item.trim());
  }
  return items;
}
