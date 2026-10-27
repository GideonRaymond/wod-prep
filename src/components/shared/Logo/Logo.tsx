import { ViewTransition, type ReactNode } from "react";
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
    <BrandTransition>
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
    </BrandTransition>
  );
}

/**
 * How the header logo comes and goes between steps: it fades and scales in when it appears
 * (leaving home, which shows the brand big instead), and simply stays put between the other
 * steps, which share it by name. Going home it just goes. See brand-in in globals.css.
 */
function BrandTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition name="brand" share="none" enter="brand-in" exit="none" default="none">
      {children}
    </ViewTransition>
  );
}

/**
 * The tally's strokes, drawn by hand: each a little different in lean, bow and weight, with small
 * gaps (the dashes) where the chalk skipped. Shared with app/icon.svg, which draws the same paths.
 */
const STROKES = [
  { d: "M9.3 8.9C9.6 13.2 8.9 18.6 9.4 23.4", width: 2.5, skips: "5.2 .9 7 .7 30" },
  { d: "M13.8 8.1C14 12.9 13.5 18.9 13.7 23.9", width: 2.2, skips: "3 .8 9.5 1 30" },
  { d: "M18.1 8.7C18.4 13 17.9 18.2 18.3 23.2", width: 2.6, skips: "8 .9 3.5 .6 30" },
  { d: "M22.5 8.2C22.7 12.6 22.3 19 22.6 23.8", width: 2.3, skips: "4.4 1 6 .8 30" },
];
const SLASH = {
  d: "M5.4 21.9C11.8 18.9 18.8 14.8 26.8 10.3",
  width: 2.9,
  skips: "8 1 6.5 .7 4 .9 40",
};

/** The filter's id; every mark defines the same filter, so a repeat on the page is harmless. */
const CHALK_FILTER = "logo-chalk";

/**
 * Just the mark: the tally on its chalkboard tile, in chalk. A filter wobbles the strokes' edges
 * and lets a few specks of board show through; its numbers are in the mark's 32-unit grid, so the
 * texture scales with the logo. Decorative, so hidden from screen readers.
 */
export function LogoMark({ size = 28, className }: LogoProps) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={cn("shrink-0 dark:[&>rect]:stroke-zinc-700", className)}
    >
      <defs>
        <filter id={CHALK_FILTER} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.7"
            numOctaves={2}
            seed={3}
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale={0.9}
            xChannelSelector="R"
            yChannelSelector="G"
            result="rough"
          />
          <feTurbulence type="fractalNoise" baseFrequency="1.6" seed={11} result="grain" />
          <feColorMatrix
            in="grain"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.2 1.75"
            result="specks"
          />
          <feComposite in="rough" in2="specks" operator="in" />
        </filter>
      </defs>
      <rect width="32" height="32" rx="8" fill="#26262b" strokeWidth="1" />
      <g fill="none" strokeLinecap="round" filter={`url(#${CHALK_FILTER})`}>
        {STROKES.map((stroke) => (
          <path
            key={stroke.d}
            d={stroke.d}
            stroke="#f4f4f5"
            strokeWidth={stroke.width}
            strokeDasharray={stroke.skips}
          />
        ))}
        <path
          d={SLASH.d}
          stroke="#d8b4fe"
          strokeWidth={SLASH.width}
          strokeDasharray={SLASH.skips}
        />
      </g>
    </svg>
  );
}
