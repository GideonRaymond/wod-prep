import { Dumbbell, Repeat, X } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import type { Movement } from "@/schemas/wod";

const CATEGORY_TONES: Record<Movement["category"], BadgeTone> = {
  weightlifting: "amber",
  gymnastics: "sky",
  monostructural: "emerald",
  other: "neutral",
};

export type MovementCardProps = {
  movement: Movement;
  onRemove: () => void;
};

export function MovementCard({ movement, onRemove }: MovementCardProps) {
  const { name, reps, load, category, originalText } = movement;

  return (
    <Card as="li">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-medium">{name}</h3>
        <div className="flex items-center gap-2">
          <Badge tone={CATEGORY_TONES[category]}>{category}</Badge>
          <Button
            variant="icon"
            size="icon"
            icon={X}
            onClick={onRemove}
            aria-label={`Remove ${name}`}
          />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
        {reps && (
          <span className="flex items-center gap-1.5" title="Reps">
            <Repeat size={14} aria-hidden /> {reps}
          </span>
        )}
        {load && (
          <span className="flex items-center gap-1.5" title="Load">
            <Dumbbell size={14} aria-hidden /> {load}
          </span>
        )}
        {!reps && !load && <span>{originalText}</span>}
      </div>
    </Card>
  );
}
