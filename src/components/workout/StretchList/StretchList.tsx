import { WatchLink } from "@/components/shared/WatchLink";
import type { Stretch } from "@/data/stretches";

/** Suggested stretches: each with what it stretches, how long, anything it needs and a demo. */
export function StretchList({ stretches }: { stretches: Stretch[] }) {
  return (
    <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {stretches.map((stretch) => (
        <li key={stretch.name} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium">{stretch.name}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {[stretch.dose, stretch.equipment].filter(Boolean).join(" · ")}
            </p>
            <p className="text-subtle text-xs first-letter:uppercase">{stretch.areas.join(", ")}</p>
          </div>
          <WatchLink name={stretch.name} video={stretch.video} />
        </li>
      ))}
    </ul>
  );
}
