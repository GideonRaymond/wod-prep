import type { Step } from "@/components/shared/Stepper";

/** The three steps from a pasted workout to the class, as the stepper and home screen show them. */
export const WOD_STEPS = [
  {
    label: "Workout",
    href: "/",
    summary: "Write or paste today's workout on the board.",
  },
  {
    label: "Check",
    href: "/review",
    summary:
      "We break it into parts, movements and the intended stimulus. Fix anything we read wrong.",
  },
  {
    label: "Class",
    href: "/workout",
    summary:
      "Get the class built around it: a warm-up, skill practice, timing, videos and articles to read before, and a cool-down.",
  },
] as const satisfies readonly (Step & { summary: string })[];

export const STEP = { workout: 0, review: 1, class: 2 } as const;

/**
 * The view transition type for moving between steps (see FlowPage): the page beside the board
 * slides in from the right going forward, and from the left going back.
 */
export const stepTransition = (from: number, to: number) => [
  to > from ? "nav-forward" : "nav-back",
];
