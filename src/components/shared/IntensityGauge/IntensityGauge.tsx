import { useId } from "react";
import { cn } from "@/utils/cn";
import { describeIntensity } from "@/utils/describeIntensity";

const MIN = 1;
const MAX = 10;
const CX = 40;
const CY = 40;
const RADIUS = 32;

export type IntensityGaugeProps = {
  /** Intensity on a 1-10 scale. */
  value: number;
  className?: string;
};

/** Half-circle gauge from green (1) to red (10) with a needle at the value. */
export function IntensityGauge({ value, className }: IntensityGaugeProps) {
  const intensity = Math.min(MAX, Math.max(MIN, Math.round(value)));
  const angle = Math.PI * (1 - (intensity - MIN) / (MAX - MIN));
  const needleLength = RADIUS - 8;
  const gradientId = `intensity-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const word = describeIntensity(intensity);

  return (
    <div
      role="meter"
      aria-label="Intensity"
      aria-valuemin={MIN}
      aria-valuemax={MAX}
      aria-valuenow={intensity}
      aria-valuetext={`${intensity} out of ${MAX}, ${word}`}
      className={cn("flex items-center gap-2", className)}
    >
      <svg
        viewBox="0 0 80 46"
        width={64}
        height={37}
        aria-hidden
        className="text-zinc-700 dark:text-zinc-200"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        <path
          d={`M ${CX - RADIUS} ${CY} A ${RADIUS} ${RADIUS} 0 0 1 ${CX + RADIUS} ${CY}`}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={8}
          strokeLinecap="round"
        />
        <line
          data-testid="intensity-needle"
          x1={CX}
          y1={CY}
          x2={CX + needleLength * Math.cos(angle)}
          y2={CY - needleLength * Math.sin(angle)}
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx={CX} cy={CY} r={4} fill="currentColor" />
      </svg>
      <div className="leading-tight">
        <p className="text-sm font-semibold">
          {intensity}/{MAX}
        </p>
        <p className="text-subtle text-xs">{word}</p>
      </div>
    </div>
  );
}
