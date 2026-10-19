import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { MovementDetails } from "@/components/shared/MovementDetails";
import { WatchLink } from "@/components/shared/WatchLink";
import { PointsOfPerformance } from "@/components/workout/PointsOfPerformance";
import type { MovementItem } from "@/types/wod";

export type ExerciseListProps = {
  movements: MovementItem[];
  /** Workout parts show each movement's category and its points of performance. */
  detailed?: boolean;
};

/**
 * The exercises of a stage (movements, warm-up drills, stretches): name, reps and load, and a
 * Watch link to the movement's first video once one is found.
 */
export function ExerciseList({ movements, detailed = false }: ExerciseListProps) {
  return (
    <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {movements.map((movement) => (
        <li key={movement.id} className="py-3 first:pt-0 last:pb-0">
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <h3 className="font-medium">{movement.name}</h3>
              {detailed && <CategoryBadge category={movement.category} />}
            </div>
            {movement.videos?.[0] && <WatchLink name={movement.name} video={movement.videos[0]} />}
          </div>
          <MovementDetails movement={movement} />
          {detailed && <PointsOfPerformance name={movement.name} />}
        </li>
      ))}
    </ul>
  );
}
