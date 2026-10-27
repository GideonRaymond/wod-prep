import { LogoMark } from "@/components/shared/Logo";
import { APP_NAME, APP_TAGLINE } from "@/constants/brand";
import { WOD_STEPS } from "@/constants/flow";

/**
 * The home screen beside the board: the brand at full size (the page header leaves its small logo
 * out here), then the three steps to get prepped.
 */
export function Welcome() {
  return (
    <div>
      <h1 className="flex items-center gap-3 text-4xl font-bold tracking-tight sm:gap-4 sm:text-5xl">
        <LogoMark size={56} className="size-12 sm:size-14" />
        {APP_NAME}
      </h1>
      <p className="mt-3 text-xl font-medium text-purple-700 dark:text-purple-300">{APP_TAGLINE}</p>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Get ready for today&apos;s class in three steps.
      </p>
      <ol aria-label="How it works" className="mt-6 space-y-4">
        {WOD_STEPS.map((step, i) => (
          <li key={step.href} className="flex gap-3">
            <span
              aria-hidden
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-800 dark:bg-purple-950 dark:text-purple-200"
            >
              {i + 1}
            </span>
            <div>
              <p className="font-medium">{step.label}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{step.summary}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
