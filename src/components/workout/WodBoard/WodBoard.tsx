"use client";

import { useState } from "react";
import { Button } from "@/components/shared/Button";
import type { WorkoutPartState } from "@/types/wod";
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

/**
 * The pasted workout written on a whiteboard: each part's first line in marker, the rest in
 * handwriting. When no part has a real name (like "Fran"), "WOD" heads the board. The board stays
 * white in dark mode, like a real one. On phones it's capped with a fade and a Show all button.
 * The handwriting is only a look: every line is the athlete's own text, read as written.
 */
export function WodBoard({ parts }: { parts: WorkoutPartState[] }) {
  const [showAll, setShowAll] = useState(false);
  const named = parts.some((part) => part.named);

  return (
    <div
      className={cn(
        "relative rounded-lg border-[6px] border-zinc-300 bg-[#fdfdfb] px-5 pt-4 pb-5 text-purple-950 shadow-[inset_0_0_0_1px_#e4e4e7]",
        !showAll && "max-sm:max-h-[190px] max-sm:overflow-hidden",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {!named && (
          <p className={cn(markerFont.className, "mb-2 text-2xl leading-8 text-purple-800")}>WOD</p>
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
        {parts.map((part, i) => (
          <Block key={part.id} part={part} ink={INKS[i % INKS.length]} />
        ))}
      </div>
      {!showAll && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-b from-[#fdfdfb]/0 to-[#fdfdfb] sm:hidden"
        />
      )}
    </div>
  );
}

function Block({ part, ink }: { part: WorkoutPartState; ink: string }) {
  const [heading, ...lines] = part.sourceText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div>
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
