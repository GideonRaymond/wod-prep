import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

const VARIANTS = {
  primary: "bg-zinc-900 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900",
  secondary: "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
  dashed:
    "w-full justify-center border border-dashed border-zinc-300 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900",
  icon: "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200",
};

const SIZES = {
  xs: "rounded px-2 py-1 text-sm",
  sm: "rounded-md px-3 py-1.5 text-sm",
  md: "rounded-lg px-4 py-2",
  icon: "rounded p-1",
};

const ICON_SIZES = { xs: 14, sm: 14, md: 16, icon: 16 };

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  /** Icon shown before the label (or alone, for icon-only buttons with an aria-label). */
  icon?: LucideIcon;
};

export type ButtonStyleProps = {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  className?: string;
};

/** The classes for a button look, also used by ButtonLink. */
export function buttonClass({ variant = "primary", size = "md", className }: ButtonStyleProps) {
  return cn(
    "inline-flex items-center gap-1.5 transition-colors disabled:opacity-40",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export const BUTTON_ICON_SIZES = ICON_SIZES;

export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  type = "button",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={buttonClass({ variant, size, className })} {...props}>
      {Icon && <Icon size={ICON_SIZES[size]} aria-hidden />}
      {children}
    </button>
  );
}
