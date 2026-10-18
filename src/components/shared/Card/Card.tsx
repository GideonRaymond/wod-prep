import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "li" | "section" | "form";
};

export function Card({ as: Tag = "div", className, ...props }: CardProps) {
  return (
    <Tag
      className={cn(
        "bg-background rounded-lg border border-zinc-200 p-4 dark:border-zinc-800",
        className,
      )}
      {...props}
    />
  );
}
