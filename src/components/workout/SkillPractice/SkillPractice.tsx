import { Card } from "@/components/shared/Card";
import type { SkillBlock } from "@/schemas/classPrep";

/**
 * Practice for one skill: why it's practiced today, then its progressions as numbered steps, each
 * with its time, dose, coaching point and when to move on. On phones each step's number sits above
 * it rather than beside it.
 */
export function SkillPractice({ skill }: { skill: SkillBlock }) {
  return (
    <Card>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{skill.why}</p>
      {skill.setupMinutes > 0 && (
        <p className="text-subtle mt-1 text-xs">Includes {skill.setupMinutes} min to set up.</p>
      )}
      <ol className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
        {skill.progressions.map((step, i) => (
          // On phones the number sits above the step, so its text can use the full width.
          <li key={i} className="flex flex-col gap-1.5 py-3 last:pb-0 sm:flex-row sm:gap-3">
            <span
              aria-hidden
              className="bg-accent-faint flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-purple-700 dark:text-purple-300"
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-medium">{step.name}</h3>
                <span className="text-subtle text-xs whitespace-nowrap tabular-nums">
                  {step.minutes} min
                </span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{step.dose}</p>
              <p className="mt-1 text-sm">{step.focus}</p>
              {step.advanceWhen && (
                <p className="text-subtle mt-1 text-xs">Move on after: {step.advanceWhen}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
