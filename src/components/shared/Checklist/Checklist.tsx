import { Circle, CircleCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

export type ChecklistState = "waiting" | "working" | "done";

export type ChecklistItem = {
  id: string;
  name: string;
  state: ChecklistState;
  /** A short result or hint under the name, e.g. "12 min · Rower". */
  meta?: string;
  /** A round icon marker, like Flame for the warm-up. */
  icon?: LucideIcon;
  /** A letter pill marker instead, like "A" or "Skill". */
  marker?: string;
  /** Rows nested under this one, on a guide line. */
  children?: ChecklistItem[];
};

/**
 * Steps that tick off on their own: waiting (an outline circle, muted name), working (a spinner)
 * or done (a check, with a short result). The spinner is decoration; the state is also in the
 * icon's label and the text.
 */
export function Checklist({ items, label }: { items: ChecklistItem[]; label?: string }) {
  return (
    <ul aria-label={label}>
      {items.map((item) => (
        <li key={item.id}>
          <Row item={item} />
          {item.children && item.children.length > 0 && (
            // The 2px guide line runs down the middle of the parent's round marker: past the 20px
            // state icon and 12px gap, half the 24px marker, less half the line (32 + 12 - 1).
            <ul className="ml-[43px] border-l-2 border-purple-200 pl-3 dark:border-purple-900">
              {item.children.map((child) => (
                <li key={child.id}>
                  <Row item={child} />
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

const STATE_LABELS: Record<ChecklistState, string> = {
  waiting: "Waiting",
  working: "Working on it",
  done: "Done",
};

function Row({ item }: { item: ChecklistItem }) {
  const { name, state, meta, icon: Icon, marker } = item;
  return (
    <div className="motion-safe:animate-row-in flex items-start gap-3 py-2">
      <span
        role="img"
        aria-label={STATE_LABELS[state]}
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center",
          state === "waiting"
            ? "text-zinc-300 dark:text-zinc-700"
            : "text-purple-600 dark:text-purple-400",
        )}
      >
        {state === "done" ? (
          <CircleCheck size={20} aria-hidden />
        ) : state === "working" ? (
          <span
            aria-hidden
            className="size-4 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600 motion-reduce:animate-[spin_3s_linear_infinite] dark:border-purple-900 dark:border-t-purple-400"
          />
        ) : (
          <Circle size={20} aria-hidden />
        )}
      </span>
      {Icon ? (
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200">
          <Icon size={14} aria-hidden />
        </span>
      ) : marker ? (
        <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-purple-600 px-1.5 text-xs font-semibold text-white dark:bg-purple-400 dark:text-purple-950">
          {marker}
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm",
            state === "waiting" ? "text-zinc-600 dark:text-zinc-400" : "font-medium",
          )}
        >
          {name}
        </p>
        {meta && <p className="text-subtle text-xs">{meta}</p>}
      </div>
    </div>
  );
}
