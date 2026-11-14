import { ArrowLeftRight, Baby, Shuffle } from "lucide-react";
import { Badge } from "@/components/shared/Badge";
import type { MovementAlternatives as Options } from "@/schemas/classPrep";

export type MovementAlternativesProps = { alternatives: Options };

/**
 * What to do instead of a movement, chosen for the part's stimulus: a similar version for athletes
 * who can do something like it, and a different movement for those who can't do it at all, each
 * with how it keeps the stimulus. Then, when it's one to avoid in pregnancy, why.
 */
export function MovementAlternatives({ alternatives }: MovementAlternativesProps) {
  const { similar, different, pregnancy } = alternatives;
  const rows = [
    { label: "Similar", icon: ArrowLeftRight, option: similar },
    { label: "Can't do it", icon: Shuffle, option: different },
  ];
  return (
    <div className="mt-3 text-sm">
      <h4 className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Alternatives</h4>
      <ul className="mt-1 space-y-1.5">
        {rows.map(({ label, icon: Icon, option }) => (
          <li key={label} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <Badge className="inline-flex shrink-0 items-center gap-1 self-center">
              <Icon size={12} aria-hidden />
              {label}
            </Badge>{" "}
            <span className="font-medium">{option.name}</span>{" "}
            <span className="text-zinc-600 dark:text-zinc-400">{option.why}</span>
          </li>
        ))}
      </ul>
      {pregnancy.avoid && (
        <p className="mt-2 text-amber-900 dark:text-amber-200">
          <span className="font-medium">Avoid when pregnant</span>
          {pregnancy.why ? `: ${pregnancy.why.replace(/\.$/, "")}.` : "."} Use an alternative.
        </p>
      )}
    </div>
  );
}

/** Marks a movement pregnant athletes should generally avoid as written, next to its name. */
export function PregnancyBadge({ alternatives }: { alternatives: Options | null }) {
  if (!alternatives?.pregnancy.avoid) return null;
  return (
    <Badge
      tone="caution"
      title={alternatives.pregnancy.why ?? undefined}
      className="inline-flex items-center gap-1 font-medium"
    >
      <Baby size={12} aria-hidden />
      Not when pregnant
    </Badge>
  );
}
