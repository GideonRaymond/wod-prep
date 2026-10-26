import Link from "next/link";
import { cn } from "@/utils/cn";
import { APP_NAME } from "@/constants/brand";

export type LogoProps = {
  /** Size of the mark in pixels. */
  size?: number;
  className?: string;
};

/**
 * The Chalkup mark and name, linking home. The mark is a tally on a small chalkboard: four
 * strokes and a rising slash. It keeps its own board in both themes, like the favicon.
 */
export function Logo({ size = 28, className }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 rounded-md text-lg font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 dark:focus-visible:outline-purple-400",
        className,
      )}
    >
      <LogoMark size={size} />
      {APP_NAME}
    </Link>
  );
}

/** Just the mark: the tally on its chalkboard tile. Decorative, so hidden from screen readers. */
export function LogoMark({ size = 28, className }: LogoProps) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={cn("shrink-0 dark:[&>rect]:stroke-zinc-700", className)}
    >
      <rect width="32" height="32" rx="8" fill="#26262b" strokeWidth="1" />
      <g fill="none" strokeLinecap="round">
        <g stroke="#f4f4f5" strokeWidth="2.4">
          <path d="M9.2 8.6c.2 4.6-.3 10 .1 15" />
          <path d="M13.6 8.2c.3 4.8-.2 10.4.1 15.4" />
          <path d="M18 8.5c.2 4.6-.2 10.2.1 15.1" />
          <path d="M22.4 8.3c.3 4.7-.2 10.3 0 15.2" />
        </g>
        <path d="M5.6 21.6C12 18.6 19 14.6 26.6 10.6" stroke="#d8b4fe" strokeWidth="2.8" />
      </g>
    </svg>
  );
}
