import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export function Alert({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      role="alert"
      className={cn(
        "rounded-lg bg-red-50 p-3 text-red-800 dark:bg-red-950 dark:text-red-200",
        className,
      )}
      {...props}
    />
  );
}
