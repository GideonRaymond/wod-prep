import { Backpack } from "lucide-react";

export type EquipmentListProps = {
  items?: string[];
  /** "You'll need" for one stage, "Equipment today" for the whole class. */
  label?: string;
};

/** The equipment for a stage (or the whole class) as outlined chips. Renders nothing when empty. */
export function EquipmentList({ items = [], label = "You'll need" }: EquipmentListProps) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 inline-flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
        <Backpack size={14} aria-hidden />
        {label}
      </span>
      <ul aria-label={label} className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-full border border-zinc-200 px-2 py-0.5 text-xs dark:border-zinc-800"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The same equipment as one quiet line, for a folded stage. */
export function EquipmentLine({ items = [] }: { items?: string[] }) {
  if (items.length === 0) return null;
  return (
    <span className="inline-flex w-full items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
      <Backpack size={12} aria-hidden />
      <span className="sr-only">You&apos;ll need: </span>
      {items.join(" · ")}
    </span>
  );
}
