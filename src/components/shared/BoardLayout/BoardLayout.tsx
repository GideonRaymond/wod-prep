import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export type BoardLayoutProps = {
  /** The whiteboard, and anything that goes under it. */
  board: ReactNode;
  children: ReactNode;
  /** On phones, put the side above the board instead of under it. */
  sideFirstOnPhones?: boolean;
  className?: string;
};

/**
 * The whiteboard on the left with the page beside it, or on top on phones. Every step of the flow
 * uses it, so the board stays put while what's beside it changes. The board stays in view while
 * the side scrolls.
 */
export function BoardLayout({
  board,
  children,
  sideFirstOnPhones = false,
  className,
}: BoardLayoutProps) {
  return (
    <div
      className={cn(
        "grid gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-start",
        className,
      )}
    >
      <div className="md:sticky md:top-6">{board}</div>
      <div className={cn("min-w-0", sideFirstOnPhones && "max-md:order-first")}>{children}</div>
    </div>
  );
}
