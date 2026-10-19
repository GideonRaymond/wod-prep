import { ViewTransition, type HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

/**
 * The whiteboard itself: a white board in a grey frame, white in dark mode too, like a real one.
 * The board you write the workout on and the board it's written up on are the same frame, so it
 * stays put between them and moves between pages as one board.
 */
export function BoardFrame({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <ViewTransition name="wod-board" share="morph" default="none">
      <div
        className={cn(
          "relative rounded-lg border-[6px] border-zinc-300 bg-[#fdfdfb] px-5 pt-4 pb-5 text-purple-950 shadow-[inset_0_0_0_1px_#e4e4e7]",
          className,
        )}
        {...props}
      />
    </ViewTransition>
  );
}
