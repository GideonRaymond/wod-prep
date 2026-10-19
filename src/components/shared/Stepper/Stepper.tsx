import Link from "next/link";
import { Check } from "lucide-react";
import { stepTransition } from "@/constants/flow";
import { cn } from "@/utils/cn";

export type Step = { label: string; href: string };

export type StepperProps = {
  steps: readonly Step[];
  /** The step this page is (0-based). */
  current: number;
  /** The last step that can be opened from here; earlier steps are always links. */
  reachable?: number;
};

/**
 * Where a flow is, across the top of the page: done steps get a check, the current one is
 * filled in, and the rest wait. Steps that can be opened from here are links.
 */
export function Stepper({ steps, current, reachable = current }: StepperProps) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center justify-center gap-2 text-sm">
        {steps.map((step, i) => {
          const state = i < current ? "done" : i === current ? "current" : "next";
          const content = (
            <>
              <span
                aria-hidden
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  state === "done" &&
                    "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
                  state === "current" &&
                    "bg-purple-700 text-white dark:bg-purple-400 dark:text-zinc-950",
                  state === "next" && "border border-zinc-300 text-zinc-500 dark:border-zinc-700",
                )}
              >
                {state === "done" ? <Check size={14} strokeWidth={3} /> : i + 1}
              </span>
              <span className={cn(state === "next" ? "text-subtle" : "font-medium")}>
                {step.label}
              </span>
            </>
          );
          return (
            <li key={step.href} className="flex min-w-0 items-center gap-2">
              {i > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    "h-px w-6 sm:w-12",
                    i <= current
                      ? "bg-purple-300 dark:bg-purple-800"
                      : "bg-zinc-200 dark:bg-zinc-800",
                  )}
                />
              )}
              {i !== current && i <= reachable ? (
                <Link
                  href={step.href}
                  transitionTypes={stepTransition(current, i)}
                  aria-label={state === "done" ? `${step.label} (done)` : undefined}
                  className="-m-1 flex items-center gap-2 rounded-md p-1 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-purple-600 dark:hover:bg-zinc-900"
                >
                  {content}
                </Link>
              ) : (
                <span
                  aria-current={i === current ? "step" : undefined}
                  className="flex items-center gap-2"
                >
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
