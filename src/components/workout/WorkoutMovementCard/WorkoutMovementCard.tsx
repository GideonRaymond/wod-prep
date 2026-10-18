import { Card } from "@/components/shared/Card";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { MovementDetails } from "@/components/shared/MovementDetails";
import { PointsOfPerformance } from "@/components/workout/PointsOfPerformance";
import type { Movement } from "@/schemas/wod";

/** A movement on the workout page, with its points of performance. */
export function WorkoutMovementCard({ movement }: { movement: Movement }) {
  return (
    <Card as="li">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-medium">{movement.name}</h3>
        <CategoryBadge category={movement.category} />
      </div>
      <MovementDetails movement={movement} />
      <PointsOfPerformance name={movement.name} />
    </Card>
  );
}
