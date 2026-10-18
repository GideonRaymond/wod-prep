import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export function Alert({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      role="alert"
      className={cn(
        "rounded-lg bg-rose-50 p-3 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
        className,
      )}
      {...props}
    />
  );
}
