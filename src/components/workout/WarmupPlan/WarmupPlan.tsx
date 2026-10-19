import { Card } from "@/components/shared/Card";
import type { WarmupPlan as Plan } from "@/schemas/classPrep";

/** A planned warm-up: what it's for, its round scheme and each drill with its dose. */
export function WarmupPlan({ warmup }: { warmup: Plan }) {
  return (
    <Card>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{warmup.focus}</p>
      {warmup.rounds && <p className="mt-2 text-sm font-medium">{warmup.rounds}</p>}
      <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
        {warmup.drills.map((drill, i) => (
          <li key={i} className="flex items-baseline justify-between gap-3 py-2 text-sm">
            <span className="font-medium">{drill.name}</span>
            {drill.dose && (
              <span className="text-right text-zinc-600 dark:text-zinc-400">{drill.dose}</span>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
