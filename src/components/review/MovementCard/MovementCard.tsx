import { X } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { MovementDetails } from "@/components/shared/MovementDetails";
import type { Movement } from "@/schemas/wod";

export type MovementCardProps = {
  movement: Movement;
  onRemove: () => void;
};

/** A movement in the review list, with a button to remove it. */
export function MovementCard({ movement, onRemove }: MovementCardProps) {
  const { name, category } = movement;

  return (
    <Card as="li">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-medium">{name}</h3>
        <div className="flex items-center gap-2">
          <CategoryBadge category={category} />
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
    </Card>
  );
}
