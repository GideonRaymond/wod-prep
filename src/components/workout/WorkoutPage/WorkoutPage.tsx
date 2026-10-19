"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { ClipboardList, Flame, Lightbulb, Snowflake, Target, type LucideIcon } from "lucide-react";
import { BeforeClass, beforeClassCounts } from "@/components/workout/BeforeClass";
import { ClassStage, StageMarker } from "@/components/workout/ClassStage";
import { EquipmentLine, EquipmentList } from "@/components/workout/EquipmentList";
import { ExerciseList } from "@/components/workout/ExerciseList";
import {
  classChecklist,
  LoadingScreen,
  waitingReferences,
} from "@/components/workout/LoadingScreen";
import { SkillPractice } from "@/components/workout/SkillPractice";
import { StretchList } from "@/components/workout/StretchList";
import { WarmupPlan } from "@/components/workout/WarmupPlan";
import { WhileYouWait } from "@/components/workout/WhileYouWait";
import { Briefing } from "@/components/workout/Briefing";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { Card } from "@/components/shared/Card";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { FlowPage } from "@/components/shared/FlowPage";
import { OvertimeNote } from "@/components/shared/OvertimeNote";
import { WodBoard, type BoardNav } from "@/components/shared/WodBoard";
import { MOCK_LOAD } from "@/constants/dev";
import { STEP, WOD_STEPS, stepTransition } from "@/constants/flow";
import { FORMAT_LABELS } from "@/constants/wod";
import { useArticles } from "@/hooks/useArticles";
import { useBoardRedraw } from "@/hooks/useBoardRedraw";
import { useClassPrep } from "@/hooks/useClassPrep";
import { useCurrentStage } from "@/hooks/useCurrentStage";
import { useHandOver } from "@/hooks/useHandOver";
import { useMovementVideos } from "@/hooks/useMovementVideos";
import { useWod } from "@/providers/WodProvider";
import { prepKey } from "@/services/classPrepApi";
import type { Stretch } from "@/data/stretches";
import type { ClassPrep } from "@/schemas/classPrep";
import type { WodState, WorkoutPartState } from "@/types/wod";
import {
  allEquipment,
  classEnd,
  classOvertime,
  isPlannedPart,
  minimumOvertime,
  planClass,
  skillMinutes,
  type PlannedPart,
  type PlannedPrep,
} from "@/utils/classPlan";
import { classBoard } from "@/utils/boardItems";
import { cn } from "@/utils/cn";
import { describeIntensity } from "@/utils/describeIntensity";
import { classStretches } from "@/utils/suggestStretches";

type Stage = {
  key: string;
  title: string;
  /** Shorter name, for the whiteboard folded into a bar on phones. */
  label: string;
  icon?: LucideIcon;
  markerLabel?: string | null;
  when: string | null;
  subtitle?: string;
  aside?: ReactNode;
  summary?: ReactNode;
  body: ReactNode;
};

/** The links under the board fade out with the loading screen. */
const FADE = "motion-safe:transition motion-safe:duration-400";
const FADED = "pointer-events-none -translate-y-2 opacity-0";

const minute = (at: number | null) => (at === null ? null : `${at}′`);
/** Before class and the briefing start open; the warm-up, parts and cool-down start folded. */
const INITIALLY_OPEN = { pre: true, briefing: true };

/**
 * The last step: the whiteboard as confirmed (edited parts redrawn, with the planned warm-up and
 * stretches), then the class on one rail: Before class, Briefing, the warm-up (programmed or
 * planned), skill practice when the workout needs it, each part and the cool-down, with suggested
 * stretches if time allows. While the class is still being built when the page opens, the loading
 * screen shows instead, then hands over and the stages settle in one by one.
 */
export function WorkoutPage() {
  const { wod, restored } = useWod();
  const videos = useMovementVideos();
  const articles = useArticles();
  const prep = useClassPrep();
  const board = useBoardRedraw();
  const finding = [videos.loading && "videos", articles.loading && "reading"].filter(Boolean);
  const busy = [
    finding.length > 0 && `Finding ${finding.join(" and ")}`,
    prep.loading && "Planning the warm-up",
    board.loading && "Redrawing the whiteboard",
  ]
    .filter(Boolean)
    .join(" · ");

  // A new parse gives new part ids, and edits change what the class is planned from.
  const workoutKey = wod ? `${wod.parts.map((p) => p.id).join(",")}|${prepKey(wod)}` : null;
  const { phase, open: openClass } = useHandOver({
    workout: workoutKey,
    building: videos.loading || articles.loading || prep.loading || board.loading,
  });
  // Someone is reading the links under the board: hold the countdown to the class.
  const [reading, setReading] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  // After the hand-over, start keyboard and screen reader users at the top of the class.
  useEffect(() => {
    if (phase === "opened") heading.current?.focus();
  }, [phase]);

  const stages = wod ? classStages(wod, prep.plan) : [];
  const [open, setOpen] = useState<Record<string, boolean>>(INITIALLY_OPEN);
  const { current, pin } = useCurrentStage(stages.map((s) => s.key));

  const isOpen = (key: string) => open[key] ?? false;
  const setAll = (value: boolean) => setOpen(Object.fromEntries(stages.map((s) => [s.key, value])));
  /** Opens a stage, makes it the current one and scrolls to it, focusing its header. */
  function jump(key: string) {
    // Render it open first, so the scroll lands where the open stage is.
    flushSync(() => setOpen((prev) => ({ ...prev, [key]: true })));
    pin(key);
    const section = document.getElementById(`stage-${key}`);
    section?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    section?.querySelector("button")?.focus({ preventScroll: true });
  }

  const building = wod !== null && (phase === "loading" || phase === "leaving");
  const leaving = phase === "leaving";
  const overtime =
    wod &&
    (prep.plan ? (
      <OvertimeNote minutes={classOvertime(wod, prep.plan)} />
    ) : (
      <OvertimeNote minutes={minimumOvertime(wod.parts)} estimate="minimum" />
    ));
  // Once the class shows, the board is its table of contents, with Before class and the
  // briefing written on above the workout.
  const nav: BoardNav | undefined =
    wod && !building
      ? {
          current,
          currentLabel: stages.find((s) => s.key === current)?.label,
          onJump: jump,
          onExpandAll: () => setAll(true),
          onCollapseAll: () => setAll(false),
        }
      : undefined;

  return (
    <FlowPage
      step={STEP.class}
      stickyBoardOnPhones={nav !== undefined}
      board={
        wod && (
          <>
            <WodBoard
              {...classBoard(wod.parts, prep.plan, { sections: nav !== undefined })}
              nav={nav}
            />
            {/* On phones the board sticks to the top as a bar, so the note goes beside it. */}
            <div className={cn("mt-3", nav && "max-md:hidden")}>{overtime}</div>
            {building && (
              <div className={cn(FADE, leaving && FADED)}>
                <WhileYouWait references={waitingReferences(wod)} onReading={setReading} />
              </div>
            )}
          </>
        )
      }
    >
      {building ? (
        <LoadingScreen
          key={workoutKey}
          checklist={classChecklist({
            wod,
            prep: prep.plan,
            prepLoading: prep.loading,
            boardLoading: board.loading,
            articlesLoading: articles.loading,
            videosPending: videos.pending,
          })}
          onOpen={openClass}
          paused={reading}
          leaving={leaving}
          autoOpen={!MOCK_LOAD}
        />
      ) : (
        <>
          <h1
            ref={heading}
            tabIndex={-1}
            className="text-3xl font-bold tracking-tight focus:outline-none"
          >
            Your workout
          </h1>
          {wod && busy && (
            <p role="status" className="text-subtle mt-1 text-sm">
              {busy}…
            </p>
          )}
          {videos.error && <p className="text-subtle mt-1 text-sm">{videos.error}</p>}
          {prep.error && <p className="text-subtle mt-1 text-sm">{prep.error}</p>}
          {articles.error && <p className="text-subtle mt-1 text-sm">{articles.error}</p>}
          {board.error && <p className="text-subtle mt-1 text-sm">{board.error}</p>}
          <div className="mt-3 md:hidden">{overtime}</div>

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
                    settleIndex={phase === "opened" ? i : undefined}
                  >
                    {stage.body}
                  </ClassStage>
                ))}
              </div>
            </>
          ) : (
            restored && (
              <Card className="mt-8">
                <p className="text-zinc-600 dark:text-zinc-400">
                  There&apos;s no workout to show yet.
                </p>
                <ButtonLink
                  href={WOD_STEPS[STEP.workout].href}
                  transitionTypes={stepTransition(STEP.class, STEP.workout)}
                  size="sm"
                  className="mt-3"
                >
                  Paste a workout
                </ButtonLink>
              </Card>
            )
          )}
        </>
      )}
    </FlowPage>
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
  const stretches = classStretches(wod.parts);
  // Stretches go with the (last) programmed cool-down, or get a cool-down of their own.
  const cooldownId = partsOf("cooldown").at(-1)?.id;

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
      key: "briefing",
      title: "Briefing",
      label: "Briefing",
      icon: ClipboardList,
      when: minute(0),
      subtitle: "The stimulus and what to know",
      body: (
        <Briefing
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
      isPlannedPart(planned)
        ? partStage(planned, markerFor, planned.part.id === cooldownId ? stretches : [])
        : prepStage(planned),
    ),
    ...(!cooldownId && stretches.length > 0 ? [stretchStage(stretches, classEnd(plan))] : []),
  ];
}

/** Stretches if time allows, with no time set aside, for a class without a programmed cool-down. */
function stretchStage(stretches: Stretch[], startsAt: number | null): Stage {
  return {
    key: "stretches",
    title: "Cool-down",
    label: "Cool-down",
    icon: Snowflake,
    when: minute(startsAt),
    subtitle: "If time allows · suggested stretches",
    summary: (
      <span className="text-subtle text-xs">{stretches.map((s) => s.name).join(" · ")}</span>
    ),
    body: (
      <Card>
        <StretchList stretches={stretches} />
      </Card>
    ),
  };
}

/** The suggested stretches under a programmed cool-down. */
function ExtraStretches({ stretches }: { stretches: Stretch[] }) {
  return (
    <Card>
      <h3 className="mb-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">
        Stretches if time allows
      </h3>
      <StretchList stretches={stretches} />
    </Card>
  );
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
  stretches: Stretch[] = [],
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
          {stretches.length > 0 && <ExtraStretches stretches={stretches} />}
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
