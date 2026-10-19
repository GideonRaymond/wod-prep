import { ClipboardList, Flame, Snowflake } from "lucide-react";
import { BoardLayout } from "@/components/shared/BoardLayout";
import { Checklist, type ChecklistItem } from "@/components/shared/Checklist";
import { WodBoard } from "@/components/shared/WodBoard";
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
 * The parse as it happens: the whiteboard, written up part by part as soon as the structure is
 * found, beside a checklist that ticks off each part as it's read.
 */
export function ParseProgress({ progress }: { progress: Progress }) {
  return (
    <section aria-label="Reading your workout" className="mt-8">
      <BoardLayout board={<WodBoard parts={progress.outline ?? []} writing={!progress.outline} />}>
        <h2 className="mb-2 text-sm font-semibold">Breaking it down</h2>
        <Checklist items={parseChecklist(progress)} />
      </BoardLayout>
    </section>
  );
}
