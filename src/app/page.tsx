import type { Metadata } from "next";
import { HomePage } from "@/components/home/HomePage";
import { STEP, WOD_STEPS } from "@/constants/flow";

export const metadata: Metadata = { title: WOD_STEPS[STEP.workout].label };

export default function Page() {
  return <HomePage />;
}
