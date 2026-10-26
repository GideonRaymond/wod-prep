import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

/**
 * The chalkboard itself: a charcoal board in a wooden frame, dark in light mode too, like a real
 * one, so it reads as the same object in both themes.
 * The board you write the workout on and the board it's written up on are the same frame in the
 * same place, so between steps the board itself never changes; only what's written on it does.
 * Every board is at least as tall as the one you write on.
 */
export function BoardFrame({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "chalk-dust relative flex min-h-80 flex-col rounded-lg border-[6px] border-[#6b5a4a] bg-[#26262b] px-5 pt-4 pb-5 text-zinc-200 shadow-[inset_0_0_0_1px_#4a3d31,inset_0_2px_18px_rgb(0_0_0/0.45)]",
        className,
      )}
      {...props}
    />
  );
}
