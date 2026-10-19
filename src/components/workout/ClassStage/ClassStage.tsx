"use client";

import { useId, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";

export type ClassStageProps = {
  /** Used for the section's id (`stage-<id>`), so Jump to can scroll to it. */
  id: string;
  /** The round marker on the rail (see StageMarker). */
  marker: ReactNode;
  /** When the stage starts, under the marker: "Before", "0′", "17′". */
  when?: string | null;
  title: string;
  subtitle?: string;
  /** Extra header content on the right, before the chevron (e.g. the intensity chip). */
  aside?: ReactNode;
  /** What to show under the header while the stage is folded. */
  summary?: ReactNode;
  open: boolean;
  onToggle: () => void;
  /** The last stage: its rail stops at the marker. */
  last?: boolean;
  /** Settle in after the loading screen, this many places after the first (60 ms apart). */
  settleIndex?: number;
  children: ReactNode;
};

/**
 * One stage of the class on the purple rail (Before class, Whiteboard, Warm-up, a part,
 * Cool-down). Its header folds it; several stages can be open at once.
 */
export function ClassStage({
  id,
  marker,
  when,
  title,
  subtitle,
  aside,
  summary,
  open,
  onToggle,
  last = false,
  settleIndex,
  children,
}: ClassStageProps) {
  const titleId = useId();
  const bodyId = useId();

  return (
    <section
      id={`stage-${id}`}
      aria-labelledby={titleId}
      style={settleIndex === undefined ? undefined : { animationDelay: `${settleIndex * 60}ms` }}
      className={cn(
        "grid scroll-mt-4 grid-cols-[36px_minmax(0,1fr)] gap-x-3",
        settleIndex !== undefined && "motion-safe:animate-settle",
      )}
    >
      <div className="flex flex-col items-center" aria-hidden>
        {marker}
        {when && (
          <span className="mt-1 text-[11px] leading-[14px] font-semibold whitespace-nowrap text-purple-700 tabular-nums dark:text-purple-300">
            {when}
          </span>
        )}
        {!last && (
          <span className="my-1 w-0.5 flex-1 rounded-full bg-purple-200 dark:bg-purple-800" />
        )}
      </div>

      <div className={cn("min-w-0", !last && "pb-8")}>
        <h2>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={bodyId}
            className="flex w-full items-start gap-3 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 dark:focus-visible:outline-purple-400"
          >
            <span className="grid min-w-0 flex-1">
              <span id={titleId} className="text-xl font-semibold">
                {title}
              </span>
              {subtitle && (
                <span className="text-sm font-normal text-zinc-600 dark:text-zinc-400">
                  {subtitle}
                </span>
              )}
            </span>
            {aside}
            <ChevronDown
              size={20}
              aria-hidden
              className={cn(
                "mt-1 shrink-0 text-zinc-600 transition-transform dark:text-zinc-400",
                open && "rotate-180",
              )}
            />
          </button>
        </h2>

        {!open && summary && (
          <div className="mt-2 flex flex-wrap items-center gap-2">{summary}</div>
        )}

        <div id={bodyId} hidden={!open} className="mt-4 space-y-3">
          {children}
        </div>
      </div>
    </section>
  );
}
