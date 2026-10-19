"use client";

import { useRouter } from "next/navigation";
import { WodSummary } from "@/components/review/WodSummary";
import { BoardLayout } from "@/components/shared/BoardLayout";
import { Button } from "@/components/shared/Button";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { Card } from "@/components/shared/Card";
import { Stepper } from "@/components/shared/Stepper";
import { WodBoard } from "@/components/shared/WodBoard";
import { STEP, WOD_STEPS } from "@/constants/flow";
import { useWod } from "@/providers/WodProvider";
import { boardOutdated } from "@/utils/partKey";

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
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <Stepper steps={WOD_STEPS} current={STEP.review} />

      <h1 className="mt-8 text-3xl font-bold tracking-tight">Check your workout</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Make sure everything looks right, then confirm it.
      </p>

      {wod ? (
        <BoardLayout
          className="mt-6"
          board={
            <>
              <WodBoard parts={wod.parts} />
              {outdated && (
                <p className="text-subtle mt-2 text-sm">
                  Your changes go on the board when you confirm.
                </p>
              )}
            </>
          }
        >
          <WodSummary wod={wod} onChange={setWod} className="mt-0" />
          <div className="mt-10 flex flex-col items-end gap-2 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <Button
              onClick={() => router.push(WOD_STEPS[STEP.class].href)}
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
        </BoardLayout>
      ) : (
        restored && (
          <Card className="mt-8 max-w-2xl">
            <p className="text-zinc-600 dark:text-zinc-400">
              There&apos;s no workout to check yet.
            </p>
            <ButtonLink href={WOD_STEPS[STEP.workout].href} size="sm" className="mt-3">
              Paste a workout
            </ButtonLink>
          </Card>
        )
      )}
    </main>
  );
}
