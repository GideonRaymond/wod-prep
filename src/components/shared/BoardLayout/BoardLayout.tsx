import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export type BoardLayoutProps = {
  /** The whiteboard, and anything that goes under it. */
  board: ReactNode;
  children: ReactNode;
  /** Keep the board stuck to the top on phones too, over the page as it scrolls. */
  stickyOnPhones?: boolean;
  className?: string;
};

/**
 * The whiteboard on the left with the page beside it, or on top on phones. Every step of the flow
 * uses it, so the board stays put while what's beside it changes. On wider screens the board stays
 * in view at the top while the side scrolls, and scrolls on its own if it's taller than the screen.
 */
export function BoardLayout({
  board,
  children,
  stickyOnPhones = false,
  className,
}: BoardLayoutProps) {
  return (
    <div
      className={cn(
        "grid gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-start",
        className,
      )}
    >
      <div
        className={cn(
          "md:sticky md:top-6 md:max-h-[calc(100dvh-3rem)] md:overflow-y-auto",
          stickyOnPhones && "bg-background max-md:sticky max-md:top-0 max-md:z-30 max-md:py-2",
        )}
      >
        {board}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
