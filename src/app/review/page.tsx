import type { Metadata } from "next";
import { ReviewPage } from "@/components/review/ReviewPage";
import { STEP, WOD_STEPS } from "@/constants/flow";

export const metadata: Metadata = { title: WOD_STEPS[STEP.review].label };

export default function Page() {
  return <ReviewPage />;
}
