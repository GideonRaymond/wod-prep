import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

/** Validation message under a form field. Give it an id and point the field's aria-describedby at it. */
export function FieldError({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-red-600 dark:text-red-400", className)} {...props} />;
}
