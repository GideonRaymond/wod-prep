import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

/**
 * The whiteboard itself: a white board in a grey frame, white in dark mode too, like a real one.
 * The board you write the workout on and the board it's written up on are the same frame in the
 * same place, so between steps the board itself never changes; only what's written on it does.
 * Every board is at least as tall as the one you write on.
 */
export function BoardFrame({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative flex min-h-80 flex-col rounded-lg border-[6px] border-zinc-300 bg-[#fdfdfb] px-5 pt-4 pb-5 text-purple-950 shadow-[inset_0_0_0_1px_#e4e4e7]",
        className,
      )}
      {...props}
    />
  );
}
