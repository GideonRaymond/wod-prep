import { cn } from "@/utils/cn";

export type CharacterCountProps = {
  id?: string;
  length: number;
  max: number;
  className?: string;
};

export function CharacterCount({ id, length, max, className }: CharacterCountProps) {
  const atLimit = length >= max;
  return (
    <p
      id={id}
      className={cn(
        "text-right text-xs",
        atLimit ? "text-rose-600 dark:text-rose-400" : "text-subtle",
        className,
      )}
    >
      {atLimit ? `Maximum length reached (${max} characters)` : `${length} / ${max}`}
    </p>
  );
}
