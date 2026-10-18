import { Info } from "lucide-react";
import { Card } from "@/components/shared/Card";
import { IntensityGauge } from "@/components/shared/IntensityGauge";
import { EquipmentList } from "@/components/workout/EquipmentList";
import { StageMarker } from "@/components/workout/ClassStage";
import type { WorkoutPartState } from "@/types/wod";

export type WhiteboardProps = {
  /** The workout parts, whose stimulus is briefed (not the warm-up or cool-down). */
  parts: WorkoutPartState[];
  /** Notes members should know, from any part. */
  notes: { part: string; text: string }[];
  /** Everything the class needs. */
  equipment: string[];
  /** The marker to show beside each part: its label, or "WOD" for a single-part workout. */
  markerFor: (part: WorkoutPartState) => string | null;
};

/** The coach's briefing: the stimulus for each part, notes for members and the day's equipment. */
export function Whiteboard({ parts, notes, equipment, markerFor }: WhiteboardProps) {
  return (
    <>
      <Card className="divide-y divide-zinc-100 py-0 dark:divide-zinc-800">
        {parts.map((part) => (
          <div key={part.id} className="py-4">
            <div className="flex items-center gap-2">
              <StageMarker label={markerFor(part)} size="sm" />
              <h3 className="font-medium">{part.title}</h3>
            </div>
            <IntensityGauge value={part.stimulus.intensity} className="mt-2" />
            <p className="mt-2 text-sm whitespace-pre-line text-zinc-600 dark:text-zinc-400">
              {part.stimulus.description}
            </p>
          </div>
        ))}
      </Card>

      {notes.length > 0 && (
        <ul aria-label="Notes" className="space-y-2">
          {notes.map((note) => (
            <li key={`${note.part}:${note.text}`} className="flex items-start gap-2 text-sm">
              <Info
                size={16}
                aria-hidden
                className="mt-0.5 shrink-0 text-purple-700 dark:text-purple-300"
              />
              <span>
                <span className="font-medium">{note.part}:</span> {note.text}
              </span>
            </li>
          ))}
        </ul>
      )}

      {equipment.length > 0 && (
        <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <EquipmentList items={equipment} label="Equipment today" />
        </div>
      )}
    </>
  );
}
