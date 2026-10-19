"use client";

import { useRouter } from "next/navigation";
import { WodSummary } from "@/components/review/WodSummary";
import { Button } from "@/components/shared/Button";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { Card } from "@/components/shared/Card";
import { FlowPage } from "@/components/shared/FlowPage";
import { WodBoard } from "@/components/shared/WodBoard";
import { STEP, WOD_STEPS, stepTransition } from "@/constants/flow";
import { useWod } from "@/providers/WodProvider";
import { partsBoard } from "@/utils/boardItems";
import { boardOutdated } from "@/utils/partKey";
import { reachableStep } from "@/utils/reachableStep";

/**
 * The second step: check the parsed workout beside the whiteboard and fix anything that's off,
 * then confirm it. The board shows the workout as it was read; edited parts are redrawn once the
 * workout is confirmed.
 */
export function ReviewPage() {
  const router = useRouter();
  const { wod, setWod, restored } = useWod();
  const missingStimulus = wod?.parts.some((part) => !part.stimulus.description.trim());
  const outdated = wod?.parts.some(boardOutdated);

  return (
    <FlowPage
      step={STEP.review}
      // The class step does what Confirm does, so it's open whenever Confirm is: back to the class
      // as it was when nothing changed, or built afresh when something did.
      reachable={reachableStep(wod)}
      board={
        wod && (
          <>
            <WodBoard {...partsBoard(wod.parts)} />
            {outdated && (
              <p className="text-subtle mt-2 text-sm">
                Your changes go on the board when you confirm.
              </p>
            )}
          </>
        )
      }
    >
      <h1 className="text-3xl font-bold tracking-tight">Check your workout</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Make sure everything looks right, then confirm it.
      </p>

      {wod ? (
        <>
          <WodSummary wod={wod} onChange={setWod} className="mt-6" />
          <div className="mt-10 flex flex-col items-end gap-2 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <Button
              onClick={() =>
                router.push(WOD_STEPS[STEP.class].href, {
                  transitionTypes: stepTransition(STEP.review, STEP.class),
                })
              }
              disabled={missingStimulus}
              aria-describedby={missingStimulus ? "confirm-hint" : undefined}
            >
              Confirm workout
            </Button>
            {missingStimulus && (
              <p id="confirm-hint" className="text-subtle text-sm">
                Every part needs a stimulus before you can confirm.
              </p>
            )}
          </div>
        </>
      ) : (
        restored && (
          <Card className="mt-6">
            <p className="text-zinc-600 dark:text-zinc-400">
              There&apos;s no workout to check yet.
            </p>
            <ButtonLink
              href={WOD_STEPS[STEP.workout].href}
              transitionTypes={stepTransition(STEP.review, STEP.workout)}
              size="sm"
              className="mt-3"
            >
              Paste a workout
            </ButtonLink>
          </Card>
        )
      )}
    </FlowPage>
  );
}
