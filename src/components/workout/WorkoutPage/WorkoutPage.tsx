"use client";

import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ClipboardList,
  Flame,
  Lightbulb,
  Snowflake,
  Target,
  type LucideIcon,
} from "lucide-react";
import { BeforeClass, beforeClassCounts } from "@/components/workout/BeforeClass";
import { ClassStage, StageMarker } from "@/components/workout/ClassStage";
import { EquipmentLine, EquipmentList } from "@/components/workout/EquipmentList";
import { ExerciseList } from "@/components/workout/ExerciseList";
import { JumpTo } from "@/components/workout/JumpTo";
import { SkillPractice } from "@/components/workout/SkillPractice";
import { WarmupPlan } from "@/components/workout/WarmupPlan";
import { Whiteboard } from "@/components/workout/Whiteboard";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { Card } from "@/components/shared/Card";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { FORMAT_LABELS } from "@/constants/wod";
import { useArticles } from "@/hooks/useArticles";
import { useClassPrep } from "@/hooks/useClassPrep";
import { useCurrentStage } from "@/hooks/useCurrentStage";
import { useMovementVideos } from "@/hooks/useMovementVideos";
import { useWod } from "@/providers/WodProvider";
import type { ClassPrep } from "@/schemas/classPrep";
import type { WodState, WorkoutPartState } from "@/types/wod";
import {
  allEquipment,
  isPlannedPart,
  planClass,
  skillMinutes,
  type PlannedPart,
  type PlannedPrep,
} from "@/utils/classPlan";
import { describeIntensity } from "@/utils/describeIntensity";

type Stage = {
  key: string;
  title: string;
  /** Shorter name for the Jump to menu. */
  label: string;
  icon?: LucideIcon;
  markerLabel?: string | null;
  when: string | null;
  subtitle?: string;
  aside?: ReactNode;
  summary?: ReactNode;
  body: ReactNode;
};

const minute = (at: number | null) => (at === null ? null : `${at}′`);
/** Before class and the whiteboard start open; the warm-up, parts and cool-down start folded. */
const INITIALLY_OPEN = { pre: true, board: true };

/**
 * The class page on one rail: Before class, Whiteboard, the warm-up (programmed or planned),
 * skill practice when the workout needs it, each part and the cool-down.
 */
export function WorkoutPage() {
  const { wod, restored } = useWod();
  const videos = useMovementVideos();
  const articles = useArticles();
  const prep = useClassPrep();
  const finding = [videos.loading && "videos", articles.loading && "reading"].filter(Boolean);
  const busy = [
    finding.length > 0 && `Finding ${finding.join(" and ")}`,
    prep.loading && "Planning the warm-up",
  ]
    .filter(Boolean)
    .join(" · ");

  const stages = wod ? classStages(wod, prep.plan) : [];
  const [open, setOpen] = useState<Record<string, boolean>>(INITIALLY_OPEN);
  const current = useCurrentStage(stages.map((s) => s.key));

  const isOpen = (key: string) => open[key] ?? false;
  const setAll = (value: boolean) => setOpen(Object.fromEntries(stages.map((s) => [s.key, value])));
  function jump(key: string) {
    setOpen((prev) => ({ ...prev, [key]: true }));
    // Wait for the stage to open before scrolling to it and moving focus to its header.
    requestAnimationFrame(() => {
      const section = document.getElementById(`stage-${key}`);
      section?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      section?.querySelector("button")?.focus({ preventScroll: true });
    });
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12">
      <ButtonLink href="/" variant="secondary" size="xs" icon={ArrowLeft} className="-ml-2">
        Back to edit
      </ButtonLink>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Your workout</h1>
      {wod && busy && (
        <p role="status" className="text-subtle mt-1 text-sm">
          {busy}…
        </p>
      )}
      {videos.error && <p className="text-subtle mt-1 text-sm">{videos.error}</p>}
      {prep.error && <p className="text-subtle mt-1 text-sm">{prep.error}</p>}
      {articles.error && <p className="text-subtle mt-1 text-sm">{articles.error}</p>}

      {wod ? (
        <>
          <div className="mt-8">
            {stages.map((stage, i) => (
              <ClassStage
                key={stage.key}
                id={stage.key}
                marker={<StageMarker icon={stage.icon} label={stage.markerLabel} />}
                when={stage.when}
                title={stage.title}
                subtitle={stage.subtitle}
                aside={stage.aside}
                summary={stage.summary}
                open={isOpen(stage.key)}
                onToggle={() => setOpen((prev) => ({ ...prev, [stage.key]: !prev[stage.key] }))}
                last={i === stages.length - 1}
              >
                {stage.body}
              </ClassStage>
            ))}
          </div>
          <JumpTo
            stages={stages.map((s) => ({
              key: s.key,
              label: s.label,
              marker: <StageMarker icon={s.icon} label={s.markerLabel} size="sm" />,
            }))}
            current={current}
            onJump={jump}
            onExpandAll={() => setAll(true)}
            onCollapseAll={() => setAll(false)}
          />
        </>
      ) : (
        restored && (
          <Card className="mt-8">
            <p className="text-zinc-600 dark:text-zinc-400">There&apos;s no workout to show yet.</p>
            <ButtonLink href="/" size="sm" className="mt-3">
              Paste a workout
            </ButtonLink>
          </Card>
        )
      )}
    </main>
  );
}

/** Every stage of the class, in order, with what to show folded and open. */
function classStages(wod: WodState, prep: ClassPrep | null): Stage[] {
  const plan = planClass(wod, prep);
  const planned = plan.filter(isPlannedPart);
  const partsOf = (kind: PlannedPart["kind"]) =>
    planned.filter((p) => p.kind === kind).map((p) => p.part);
  const workoutParts = partsOf("part");
  // Everything the class needs, in the order it's used.
  const equipment = allEquipment([
    ...partsOf("warmup"),
    ...(prep?.warmup ? [prep.warmup] : []),
    ...(prep?.skills ?? []),
    ...wod.parts,
  ]);
  // A single-part workout is marked "WOD"; otherwise each part keeps its label.
  const markerFor = (part: WorkoutPartState) => (wod.parts.length === 1 ? "WOD" : part.label);
  const preCounts = beforeClassCounts(wod.parts);

  return [
    {
      key: "pre",
      title: "Before class",
      label: "Before class",
      icon: Lightbulb,
      when: "Before",
      subtitle: "Read and watch at home",
      summary: <span className="text-subtle text-xs">{preCounts || "Nothing to read yet"}</span>,
      body: <BeforeClass parts={wod.parts} />,
    },
    {
      key: "board",
      title: "Whiteboard",
      label: "Whiteboard",
      icon: ClipboardList,
      when: minute(0),
      subtitle: "The stimulus and what to know",
      body: (
        <Whiteboard
          parts={workoutParts}
          notes={wod.parts.flatMap((part) =>
            part.notes ? [{ part: part.title, text: part.notes }] : [],
          )}
          equipment={equipment}
          markerFor={markerFor}
        />
      ),
    },
    ...plan.map((planned) =>
      isPlannedPart(planned) ? partStage(planned, markerFor) : prepStage(planned),
    ),
  ];
}

/** The planned warm-up, or practice for one skill. */
function prepStage(planned: PlannedPrep): Stage {
  if (planned.kind === "planned-warmup") {
    const { warmup } = planned;
    return {
      key: "planned-warmup",
      title: "Warm-up",
      label: "Warm-up",
      icon: Flame,
      when: minute(planned.startsAt),
      subtitle: startsAndLasts(planned.startsAt, warmup.minutes),
      summary: (
        <>
          <span className="text-subtle text-xs">
            {warmup.drills.map((d) => d.name).join(" · ")}
          </span>
          <EquipmentLine items={warmup.equipment} />
        </>
      ),
      body: (
        <>
          <EquipmentList items={warmup.equipment} />
          <WarmupPlan warmup={warmup} />
        </>
      ),
    };
  }

  const { skill } = planned;
  const steps = skill.progressions.length;
  return {
    key: `skill-${skill.movement}`,
    title: `Skill: ${skill.movement}`,
    label: `Skill: ${skill.movement}`,
    icon: Target,
    when: minute(planned.startsAt),
    subtitle: [
      startsAndLasts(planned.startsAt, skillMinutes(skill)),
      `${steps} progression${steps === 1 ? "" : "s"}`,
    ].join(" · "),
    summary: (
      <>
        <span className="text-subtle text-xs">
          {skill.progressions.map((p) => p.name).join(" → ")}
        </span>
        <EquipmentLine items={skill.equipment} />
      </>
    ),
    body: (
      <>
        <EquipmentList items={skill.equipment} />
        <SkillPractice skill={skill} />
      </>
    ),
  };
}

const startsAndLasts = (startsAt: number | null, minutes: number) =>
  [startsAt !== null ? `Starts at ${startsAt}′` : null, `${minutes} min`]
    .filter(Boolean)
    .join(" · ");

function partStage(
  { part, kind, startsAt }: PlannedPart,
  markerFor: (part: WorkoutPartState) => string | null,
): Stage {
  const meta = [
    !part.duration && part.minutes ? `${part.minutes} min` : null,
    FORMAT_LABELS[part.format],
    part.rounds,
    part.duration,
  ].filter(Boolean);
  const subtitle = [startsAt !== null ? `Starts at ${startsAt}′` : null, ...meta]
    .filter(Boolean)
    .join(" · ");
  const equipment = part.equipment ?? [];

  if (kind !== "part") {
    const name = kind === "warmup" ? "Warm-up" : "Cool-down";
    return {
      key: part.id,
      title: name,
      label: name,
      icon: kind === "warmup" ? Flame : Snowflake,
      when: minute(startsAt),
      subtitle: [part.title, subtitle].filter(Boolean).join(" · "),
      summary: (
        <>
          <span className="text-subtle text-xs">
            {part.movements.map((m) => m.name).join(" · ")}
          </span>
          <EquipmentLine items={equipment} />
        </>
      ),
      body: (
        <>
          <EquipmentList items={equipment} />
          <Card>
            <ExerciseList movements={part.movements} />
          </Card>
        </>
      ),
    };
  }

  const marker = markerFor(part);
  return {
    key: part.id,
    title: part.title,
    label: marker && marker !== "WOD" ? `${marker} · ${part.title}` : part.title,
    markerLabel: marker,
    when: minute(startsAt),
    subtitle,
    aside: (
      <span className="mt-1 inline-flex items-baseline gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs whitespace-nowrap text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
        <span className="text-foreground font-semibold">{part.stimulus.intensity}/10</span>
        {describeIntensity(part.stimulus.intensity)}
      </span>
    ),
    summary: (
      <>
        {part.movements.map((m) => (
          <CategoryBadge key={m.id} category={m.category} label={m.name} />
        ))}
        <EquipmentLine items={equipment} />
      </>
    ),
    body: (
      <>
        <EquipmentList items={equipment} />
        <Card>
          <ExerciseList movements={part.movements} detailed />
        </Card>
      </>
    ),
  };
}
