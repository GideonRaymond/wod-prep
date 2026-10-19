"use client";

import { useEffect, useRef, useState } from "react";
import { Checklist, type ChecklistItem } from "@/components/shared/Checklist";
import { beforeClassReferences } from "@/components/workout/BeforeClass";
import { ReadyToOpen } from "@/components/workout/ReadyToOpen";
import { WhileYouWait } from "@/components/workout/WhileYouWait";
import { WodBoard } from "@/components/workout/WodBoard";
import type { WodState } from "@/types/wod";
import { cn } from "@/utils/cn";

export type LoadingScreenProps = {
  wod: WodState;
  /** The checklist so far (see classChecklist); `ready` once everything is done. */
  checklist: { items: ChecklistItem[]; ready: boolean };
  onOpen: () => void;
  /** Fading out, on the way to the class page. */
  leaving?: boolean;
};

/**
 * What members see while the class is built: the pasted workout on a whiteboard, a checklist that
 * grows from the fixed structure into this workout's own parts and skills, the Before class
 * reading as soon as it arrives, and, once everything is ready, a short countdown to the class.
 * A polite live region announces each step as it finishes.
 */
export function LoadingScreen({ wod, checklist, onOpen, leaving = false }: LoadingScreenProps) {
  const [reading, setReading] = useState(false);
  const live = useAnnouncements(checklist);
  const { articles, videos } = beforeClassReferences(wod.parts);
  const preDone = checklist.items.find((item) => item.id === "pre")?.state === "done";

  return (
    <div
      className={cn(
        "motion-safe:transition motion-safe:duration-400",
        leaving && "pointer-events-none -translate-y-2 opacity-0",
      )}
    >
      <p ref={live} aria-live="polite" className="sr-only" />
      <h1 className="text-3xl font-bold tracking-tight">Building your class</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        This takes about half a minute. Everything appears as soon as it&apos;s ready.
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <WodBoard parts={wod.parts} />
        <div>
          <h2 className="mb-2 text-sm font-semibold">Getting it ready</h2>
          <Checklist items={checklist.items} label="Getting it ready" />
          {preDone && <WhileYouWait articles={articles} videos={videos} onReading={setReading} />}
          {checklist.ready && <ReadyToOpen onOpen={onOpen} paused={reading} />}
        </div>
      </div>
    </div>
  );
}

/** Every row, nested ones included. */
const allRows = (items: ChecklistItem[]): ChecklistItem[] =>
  items.flatMap((item) => [item, ...allRows(item.children ?? [])]);

/**
 * Announces each step as it finishes ("Warm-up ready") and when the class is ready, by writing to
 * a live region. Steps already done when the screen opens aren't announced.
 */
function useAnnouncements({ items, ready }: LoadingScreenProps["checklist"]) {
  const live = useRef<HTMLParagraphElement>(null);
  const announced = useRef<Set<string> | null>(null);
  const announcedReady = useRef(false);

  useEffect(() => {
    const done = allRows(items).filter((row) => row.state === "done");
    if (announced.current === null) {
      announced.current = new Set(done.map((row) => row.id));
      return;
    }
    const finished = done.filter((row) => !announced.current!.has(row.id));
    for (const row of finished) announced.current.add(row.id);
    const nowReady = ready && !announcedReady.current;
    announcedReady.current ||= ready;
    const message = nowReady
      ? "Your class is ready"
      : finished.map((row) => `${row.name} ready`).join(". ");
    if (message && live.current) live.current.textContent = message;
  }, [items, ready]);

  return live;
}
