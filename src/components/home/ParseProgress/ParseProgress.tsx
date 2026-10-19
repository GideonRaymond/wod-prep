import { ClipboardList, Flame, Snowflake } from "lucide-react";
import { Checklist, type ChecklistItem } from "@/components/shared/Checklist";
import type { ParseProgress as Progress } from "@/hooks/useParseWod";
import type { PartOutline } from "@/schemas/wod";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** The checklist rows for a parse in progress: reading the structure, then each part found. */
export function parseChecklist({ outline, read }: Progress): ChecklistItem[] {
  const reading: ChecklistItem = {
    id: "reading",
    name: "Reading your workout",
    icon: ClipboardList,
    state: outline ? "done" : "working",
    meta: outline ? `${plural(outline.length, "part")} found` : undefined,
  };
  const single = outline?.length === 1;
  return [
    reading,
    ...(outline ?? []).map((part, index): ChecklistItem => ({
      id: `part-${index}`,
      name: part.title,
      state: read.has(index) ? "done" : "working",
      meta: read.has(index) ? undefined : "Movements, stimulus and timing",
      ...markerFor(part, single),
    })),
  ];
}

function markerFor(part: PartOutline, single: boolean): Pick<ChecklistItem, "icon" | "marker"> {
  if (part.kind === "warmup") return { icon: Flame };
  if (part.kind === "cooldown") return { icon: Snowflake };
  return { marker: single ? "WOD" : (part.label ?? undefined) };
}

/**
 * What's happening while the workout is read, beside the board it's written up on: a checklist
 * that finds the parts, then ticks off each one as it's read.
 */
export function ParseProgress({ progress }: { progress: Progress }) {
  return (
    <section aria-label="Reading your workout">
      <h1 className="text-3xl font-bold tracking-tight">Breaking it down</h1>
      <p className="mt-2 mb-6 text-zinc-600 dark:text-zinc-400">
        Writing it up on the board. This takes a few seconds.
      </p>
      <Checklist items={parseChecklist(progress)} />
    </section>
  );
}
