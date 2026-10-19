"use client";

import { useState, ViewTransition } from "react";
import { Button } from "@/components/shared/Button";
import type { BoardBlock, WorkoutPartState } from "@/types/wod";
import { cn } from "@/utils/cn";
import { handFont, markerFont } from "./fonts";

/** Marker inks for each block's heading, in turn: purples only, all at least 3:1 on the board. */
const INKS = [
  "text-purple-800",
  "text-purple-600",
  "text-purple-700",
  "text-purple-900",
  "text-purple-500",
];

/** The ink for what the app adds to the board itself (a planned warm-up, suggested stretches). */
const ADDED_INK = "text-sky-800";

/** What the board needs from a part: its whiteboard lines, or else its own text. */
export type BoardPart = Pick<WorkoutPartState, "named" | "sourceText" | "board">;

export type WodBoardProps = {
  parts: BoardPart[];
  /** A planned warm-up, written above the parts in its own ink. */
  warmup?: BoardBlock | null;
  /** Suggested stretches, written under the parts in the same ink. */
  cooldown?: BoardBlock | null;
  /** Still being written: a line is drawn where the next part will go. */
  writing?: boolean;
};

/**
 * The workout written on a whiteboard: each part's heading in marker, the rest in handwriting.
 * Parts show their whiteboard lines (the workout written out cleanly, e.g. Murph in full), or
 * their own text when they have none. When no part has a real name (like "Fran"), "WOD" heads the
 * board. A planned warm-up and suggested stretches go on in a blue marker, and anything written
 * after the board first shows rises in. The board stays white in dark mode, like a real one, and
 * moves between pages as one board. On phones it's capped with a fade and a Show all button.
 */
export function WodBoard({ parts, warmup, cooldown, writing = false }: WodBoardProps) {
  const [showAll, setShowAll] = useState(false);
  const named = parts.some((part) => part.named);
  const blocks = [
    ...(warmup ? [{ key: "warmup", block: warmup, ink: ADDED_INK }] : []),
    ...parts.map((part, i) => ({
      key: `part-${i}`,
      block: blockOf(part),
      ink: INKS[i % INKS.length],
    })),
    ...(cooldown ? [{ key: "cooldown", block: cooldown, ink: ADDED_INK }] : []),
  ];
  // Blocks already there when the board first shows don't animate; later ones are written on.
  const [initial] = useState(() => new Set(blocks.map((b) => b.key)));

  return (
    <ViewTransition name="wod-board" share="morph" default="none">
      <div
        aria-busy={writing || undefined}
        className={cn(
          "relative rounded-lg border-[6px] border-zinc-300 bg-[#fdfdfb] px-5 pt-4 pb-5 text-purple-950 shadow-[inset_0_0_0_1px_#e4e4e7]",
          !showAll && "max-sm:max-h-[190px] max-sm:overflow-hidden",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          {!named && (
            <p className={cn(markerFont.className, "mb-2 text-2xl leading-8 text-purple-800")}>
              WOD
            </p>
          )}
          <Button
            variant="secondary"
            size="xs"
            onClick={() => setShowAll(!showAll)}
            aria-expanded={showAll}
            className="ml-auto text-zinc-600 hover:bg-zinc-100 sm:hidden dark:text-zinc-600 dark:hover:bg-zinc-100"
          >
            {showAll ? "Show less" : "Show all"}
          </Button>
        </div>
        <div className="space-y-3">
          {blocks.map(({ key, block, ink }) => (
            <Block
              key={key}
              block={block}
              ink={ink}
              added={ink === ADDED_INK}
              arriving={!initial.has(key)}
            />
          ))}
          {writing && <WritingLine first={parts.length === 0} />}
        </div>
        {!showAll && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-b from-[#fdfdfb]/0 to-[#fdfdfb] sm:hidden"
          />
        )}
      </div>
    </ViewTransition>
  );
}

/** A part's heading and lines: its whiteboard lines, or its own text for older saved workouts. */
function blockOf(part: BoardPart): BoardBlock {
  const lines = part.board?.length ? part.board : part.sourceText.split("\n");
  const [heading = "", ...rest] = lines.map((line) => line.trim()).filter(Boolean);
  return { heading, lines: rest };
}

function Block({
  block,
  ink,
  added,
  arriving,
}: {
  block: BoardBlock;
  ink: string;
  added: boolean;
  arriving: boolean;
}) {
  return (
    <div className={cn(added && ink, arriving && "motion-safe:animate-rise-in")}>
      <p className={cn(markerFont.className, "text-xl leading-[26px] tracking-[.01em]", ink)}>
        {block.heading}
      </p>
      {block.lines.map((line, i) => (
        <p key={i} className={cn(handFont.className, "text-[17px] leading-[23px]")}>
          {line}
        </p>
      ))}
    </div>
  );
}

/** Faint marker strokes where the next part is being written; decoration only. */
function WritingLine({ first }: { first: boolean }) {
  return (
    <div
      aria-hidden
      data-testid="board-writing"
      className="space-y-2 pt-1 motion-safe:animate-pulse"
    >
      <div className="h-3 w-32 rounded-full bg-purple-200/70" />
      {first && <div className="h-2.5 w-48 rounded-full bg-purple-100" />}
      {first && <div className="h-2.5 w-40 rounded-full bg-purple-100" />}
    </div>
  );
}
