import type { Step } from "@/components/shared/Stepper";

/** The three steps from a pasted workout to the class, as the stepper shows them. */
export const WOD_STEPS = [
  { label: "Workout", href: "/" },
  { label: "Check", href: "/review" },
  { label: "Class", href: "/workout" },
] as const satisfies readonly Step[];

export const STEP = { workout: 0, review: 1, class: 2 } as const;
