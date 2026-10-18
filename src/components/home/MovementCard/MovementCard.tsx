import { X } from "lucide-react";
import { MovementDetails } from "@/components/home/MovementDetails";
import { PointsOfPerformance } from "@/components/home/PointsOfPerformance";
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
  const { name, category } = movement;

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
      <MovementDetails movement={movement} />
      <PointsOfPerformance name={name} />
    </Card>
  );
}
