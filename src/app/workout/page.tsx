import type { Metadata } from "next";
import { WorkoutPage } from "@/components/workout/WorkoutPage";
import { STEP, WOD_STEPS } from "@/constants/flow";

export const metadata: Metadata = { title: WOD_STEPS[STEP.class].label };

export default function Page() {
  return <WorkoutPage />;
}
