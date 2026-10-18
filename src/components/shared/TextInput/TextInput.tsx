import type { InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";
import { fieldClass } from "@/styles/fieldStyles";

export type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export function TextInput({ invalid = false, className, ...props }: TextInputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(fieldClass(invalid), "rounded-md px-2.5 py-1.5", className)}
      {...props}
    />
  );
}
