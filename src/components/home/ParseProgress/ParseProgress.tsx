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

/** What the parse has found so far, ticking off each part as it's read. */
export function ParseProgress({ progress }: { progress: Progress }) {
  return (
    <section aria-label="Reading your workout" className="mt-8">
      <Checklist items={parseChecklist(progress)} />
    </section>
  );
}
