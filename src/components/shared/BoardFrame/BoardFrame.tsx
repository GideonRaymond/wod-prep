import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export type BoardFrameProps = HTMLAttributes<HTMLDivElement> & {
  /** Classes for the whole object (frame and ledge), e.g. a focus ring around it. */
  frameClassName?: string;
};

/**
 * The chalkboard itself: a charcoal board in a light ash frame with mitred corners, and a ledge
 * underneath with a stick of white and of purple chalk and an eraser. It looks the same in light
 * and dark mode, like a real one, so it reads as the same object in both themes.
 * The board you write the workout on and the board it's written up on are the same frame in the
 * same place, so between steps the board itself never changes; only what's written on it does.
 * Every board is at least as tall as the one you write on. Props and `className` go to the board
 * (the dark writing surface); the frame and ledge are decoration (see the ash-* styles in
 * globals.css).
 */
export function BoardFrame({ className, frameClassName, ...props }: BoardFrameProps) {
  return (
    <div className={cn("ash-board", frameClassName)}>
      <div className="ash-frame">
        <span aria-hidden className="ash-bar ash-bar-top" />
        <span aria-hidden className="ash-bar ash-bar-bottom" />
        <span aria-hidden className="ash-bar ash-bar-left" />
        <span aria-hidden className="ash-bar ash-bar-right" />
        <div
          className={cn(
            "chalk-dust relative flex min-h-80 flex-col rounded-[2px] bg-[#26262b] px-5 pt-4 pb-5 text-zinc-200 shadow-[inset_0_2px_18px_rgb(0_0_0/0.45),0_0_0_1px_#a88a5a]",
            className,
          )}
          {...props}
        />
      </div>
      <div aria-hidden data-testid="board-ledge" className="ash-ledge">
        <span className="ash-ledge-chalk" />
        <span className="ash-ledge-chalk ash-ledge-chalk-purple" />
        <span className="ash-ledge-eraser" />
      </div>
    </div>
  );
}
