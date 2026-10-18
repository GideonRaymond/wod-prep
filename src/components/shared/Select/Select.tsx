import type { SelectHTMLAttributes } from "react";
import { cn } from "@/utils/cn";
import { fieldClass } from "@/styles/fieldStyles";

export type SelectOption = { value: string; label: string };

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  options: readonly SelectOption[];
};

export function Select({ options, className, ...props }: SelectProps) {
  return (
    <select className={cn(fieldClass(false), "rounded-md px-2.5 py-1.5", className)} {...props}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
