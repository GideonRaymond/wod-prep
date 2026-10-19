"use client";

import { useEffect, useState } from "react";
import { Flame, Snowflake } from "lucide-react";
import { Button } from "@/components/shared/Button";
import type { WorkoutPartState } from "@/types/wod";
import { stageKind } from "@/utils/classPlan";
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

/** How long after the previous block each one gets circled, in ms. */
const CIRCLE_STAGGER_MS = 150;

/**
 * The pasted workout written on a whiteboard: each part's first line in marker, the rest in
 * handwriting. Once the page is up, each recognised part is circled in turn and gets its marker
 * (its letter, or a flame or snowflake). The board stays white in dark mode, like a real one. On
 * phones it's capped with a fade and a Show all button. The handwriting is only a look: every line
 * is the athlete's own text, read as written.
 */
export function WodBoard({ parts }: { parts: WorkoutPartState[] }) {
  const [circled, setCircled] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Circle the blocks once the board has painted, so the outlines draw on.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setCircled(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="relative pb-3">
      <div
        className={cn(
          "relative rounded-lg border-[6px] border-zinc-300 bg-[#fdfdfb] px-5 pt-4 pb-5 text-purple-950 shadow-[inset_0_0_0_1px_#e4e4e7]",
          !showAll && "max-sm:max-h-[190px] max-sm:overflow-hidden",
        )}
      >
        <div className="mb-3 flex items-center justify-between text-xs font-medium text-zinc-600">
          <span>Your workout</span>
          <Button
            variant="secondary"
            size="xs"
            onClick={() => setShowAll(!showAll)}
            aria-expanded={showAll}
            className="text-zinc-600 hover:bg-zinc-100 sm:hidden dark:text-zinc-600 dark:hover:bg-zinc-100"
          >
            {showAll ? "Show less" : "Show all"}
          </Button>
        </div>
        <div className="space-y-2">
          {parts.map((part, i) => (
            <Block
              key={part.id}
              part={part}
              marker={parts.length === 1 ? "WOD" : part.label}
              ink={INKS[i % INKS.length]}
              circled={circled}
              delay={i * CIRCLE_STAGGER_MS}
            />
          ))}
        </div>
        {!showAll && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-b from-[#fdfdfb]/0 to-[#fdfdfb] sm:hidden"
          />
        )}
      </div>
      {/* The marker tray under the board. */}
      <span aria-hidden className="absolute inset-x-6 bottom-1.5 h-1.5 rounded-[3px] bg-zinc-300" />
    </div>
  );
}

function Block({
  part,
  marker,
  ink,
  circled,
  delay,
}: {
  part: WorkoutPartState;
  marker: string | null;
  ink: string;
  circled: boolean;
  delay: number;
}) {
  const [heading, ...lines] = part.sourceText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const kind = stageKind(part);

  return (
    <div
      data-circled={circled || undefined}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "relative -mx-2 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-2 px-2 pt-1 pb-2 motion-safe:transition-colors motion-safe:duration-450",
        circled ? "border-purple-400" : "border-transparent",
      )}
    >
      <span
        aria-hidden
        style={{ transitionDelay: `${delay}ms` }}
        className={cn(
          "absolute -top-2.5 right-1 -rotate-4 motion-safe:transition motion-safe:duration-350",
          circled ? "scale-100 opacity-100" : "scale-80 opacity-0",
        )}
      >
        {kind === "part" ? (
          marker && (
            <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-purple-600 px-[7px] text-[11px] font-semibold text-white">
              {marker}
            </span>
          )
        ) : (
          <span className="flex size-[22px] items-center justify-center rounded-full bg-purple-100 text-purple-800">
            {kind === "warmup" ? <Flame size={12} /> : <Snowflake size={12} />}
          </span>
        )}
      </span>
      <p className={cn(markerFont.className, "text-xl leading-[26px] tracking-[.01em]", ink)}>
        {heading}
      </p>
      {lines.map((line, i) => (
        <p key={i} className={cn(handFont.className, "text-[17px] leading-[23px]")}>
          {line}
        </p>
      ))}
    </div>
  );
}
