"use client";

import { useId, useRef, useState, type CSSProperties } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { BoardFrame } from "@/components/shared/BoardFrame";
import { Button } from "@/components/shared/Button";
import { useMeasuredHeight } from "@/hooks/useMeasuredHeight";
import type { BoardItem } from "@/types/wod";
import { cn } from "@/utils/cn";
import { handFont, markerFont } from "./fonts";

/** Marker inks for each part's heading, in turn: purples only, all at least 3:1 on the board. */
const INKS = [
  "text-purple-800",
  "text-purple-600",
  "text-purple-700",
  "text-purple-900",
  "text-purple-500",
];

/** The ink for what the app adds to the board itself (a planned warm-up, skills, stretches). */
const ADDED_INK = "text-sky-800";

/** Turns the board into the class's table of contents (see WodBoard). */
export type BoardNav = {
  /** The section on screen now, by stage key. */
  current?: string;
  /** Its name, for the folded board on phones. */
  currentLabel?: string;
  onJump: (key: string) => void;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
};

export type WodBoardProps = {
  items: BoardItem[];
  /** A heading for the whole board ("WOD" when no part has a real name; see boardTitle). */
  title?: string | null;
  /** Still being written: a line is drawn where the next part will go. */
  writing?: boolean;
  /** Make every block a link to its section. */
  nav?: BoardNav;
};

/**
 * The workout written on a whiteboard: each block's heading in marker, the rest in handwriting,
 * with the app's own blocks (the planned warm-up, skill practice, stretches) in a blue marker.
 * Anything written after the board first shows rises in.
 *
 * With `nav`, it's the class's table of contents: every block jumps to its section, and the one
 * on screen has a small outline. On phones it folds into a bar named after that section, which
 * opens the board to pick another. Without it, phones get a short preview and a Show all button.
 * Whenever its height changes (opening, showing all, a part written on), it eases to the new one.
 */
export function WodBoard({ items, title, writing = false, nav }: WodBoardProps) {
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const content = useRef<HTMLDivElement>(null);
  // The content's height, for the board to ease to (height: auto can't be animated).
  const height = useMeasuredHeight(content);
  // Blocks already there when the board first shows don't animate; later ones are written on.
  const [initial] = useState(() => new Set(items.map((item) => item.key)));
  let part = 0;
  const inked = items.map((item) => ({
    item,
    ink: item.added ? ADDED_INK : INKS[part++ % INKS.length],
  }));

  function jump(key: string) {
    setOpen(false);
    nav?.onJump(key);
  }

  return (
    <BoardFrame
      aria-busy={writing || undefined}
      // On phones the board is only as tall as it shows, with the same padding open or folded, so
      // nothing but the eased height changes.
      className={cn("max-sm:min-h-0", nav && "max-md:min-h-0 max-md:py-2")}
    >
      {nav && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={contentId}
          className="flex w-full items-center justify-between gap-3 text-left md:hidden"
        >
          <span className={cn(markerFont.className, "truncate text-lg text-purple-800")}>
            {nav.currentLabel ?? "Whiteboard"}
          </span>
          <span className="flex shrink-0 items-center gap-1 text-xs text-zinc-600">
            {open ? "Close" : "Jump to"}
            {open ? <ChevronUp size={16} aria-hidden /> : <ChevronDown size={16} aria-hidden />}
          </span>
        </button>
      )}
      <div
        id={contentId}
        style={height === null ? undefined : ({ "--board-h": `${height}px` } as CSSProperties)}
        className={cn(
          "overflow-hidden motion-safe:transition-[max-height,visibility] motion-safe:duration-300 motion-safe:ease-out",
          height !== null && "max-h-(--board-h)",
          !nav && !showAll && "max-sm:max-h-[142px]",
          // Folded, it's out of sight for everyone (invisible, not just clipped) once it has eased shut.
          nav && !open && "max-md:invisible max-md:max-h-0",
          nav && open && "max-md:max-h-[min(70vh,var(--board-h))] max-md:overflow-y-auto",
        )}
      >
        <div ref={content} className={cn(nav && "max-md:pt-3")}>
          <div className="flex items-start justify-between gap-3">
            {title && (
              <p className={cn(markerFont.className, "mb-2 text-2xl leading-8 text-purple-800")}>
                {title}
              </p>
            )}
            {!nav && (
              <Button
                variant="secondary"
                size="xs"
                onClick={() => setShowAll(!showAll)}
                aria-expanded={showAll}
                className="ml-auto text-zinc-600 hover:bg-zinc-100 sm:hidden dark:text-zinc-600 dark:hover:bg-zinc-100"
              >
                {showAll ? "Show less" : "Show all"}
              </Button>
            )}
          </div>
          {nav ? (
            <ul aria-label="Whiteboard" className="space-y-0.5">
              {inked.map(({ item, ink }) => (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => jump(item.key)}
                    aria-current={nav.current === item.key ? "location" : undefined}
                    className={cn(
                      "-mx-2 block w-[calc(100%+1rem)] rounded-md px-2 py-0.5 text-left hover:bg-purple-50 focus-visible:outline-2 focus-visible:outline-purple-600",
                      nav.current === item.key && "outline-2 outline-purple-300",
                    )}
                  >
                    <Block item={item} ink={ink} arriving={!initial.has(item.key)} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-3">
              {inked.map(({ item, ink }) => (
                <Block key={item.key} item={item} ink={ink} arriving={!initial.has(item.key)} />
              ))}
              {writing && <WritingLine first={items.length === 0} />}
            </div>
          )}
          {nav && (nav.onExpandAll || nav.onCollapseAll) && (
            <div className="mt-3 flex justify-between border-t border-zinc-200 pt-2 md:hidden">
              {nav.onExpandAll && (
                <Button variant="secondary" size="xs" onClick={nav.onExpandAll}>
                  Expand all
                </Button>
              )}
              {nav.onCollapseAll && (
                <Button variant="secondary" size="xs" onClick={nav.onCollapseAll}>
                  Collapse all
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      {!nav && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-b from-[#fdfdfb]/0 to-[#fdfdfb] motion-safe:transition-opacity motion-safe:duration-300 sm:hidden",
            showAll && "opacity-0",
          )}
        />
      )}
    </BoardFrame>
  );
}

function Block({ item, ink, arriving }: { item: BoardItem; ink: string; arriving: boolean }) {
  return (
    <div className={cn(item.added && ink, arriving && "motion-safe:animate-rise-in")}>
      <p
        className={cn(
          markerFont.className,
          "text-xl leading-[26px] tracking-[.01em]",
          item.added && "text-lg",
          ink,
        )}
      >
        {item.heading}
      </p>
      {item.lines.map((line, i) => (
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
