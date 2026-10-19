"use client";

import { Activity, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ParseProgress } from "@/components/home/ParseProgress";
import { Welcome } from "@/components/home/Welcome";
import { WodInputForm } from "@/components/home/WodInputForm";
import { Alert } from "@/components/shared/Alert";
import { Button } from "@/components/shared/Button";
import { Dialog } from "@/components/shared/Dialog";
import { FlowPage } from "@/components/shared/FlowPage";
import { WodBoard } from "@/components/shared/WodBoard";
import { STEP, WOD_STEPS, stepTransition } from "@/constants/flow";
import { useParseWod } from "@/hooks/useParseWod";
import { partsBoard } from "@/utils/boardItems";
import { wodEdited } from "@/utils/partKey";
import { reachableStep } from "@/utils/reachableStep";

/**
 * The first step: write the workout on the whiteboard, beside a short welcome and the steps ahead.
 * While it's read, the board is written up part by part and the welcome makes way for a checklist;
 * once it's read, the review page opens. Breaking down a new workout replaces the current one, so
 * it asks first if that one has been edited.
 */
export function HomePage() {
  const router = useRouter();
  const { wod, error, loading, progress, parsedText, restored, parse } = useParseWod();
  // New text waiting for the go-ahead to replace an edited workout.
  const [pending, setPending] = useState<string | null>(null);
  // Read, and on the way to the review page: keep showing the parse until it takes over, so the
  // text box doesn't flash back in between.
  const [opening, setOpening] = useState(false);
  // Leaving the page (Next.js keeps it, hidden) ends that, so coming back shows the text box.
  useEffect(() => {
    if (opening) return () => setOpening(false);
  }, [opening]);
  const reading = loading || opening;

  async function breakDown(text: string) {
    setPending(null);
    const review = WOD_STEPS[STEP.review].href;
    // Ready before the parse finishes, so the board can glide straight into the review page.
    router.prefetch(review);
    if (await parse(text)) {
      setOpening(true);
      router.push(review, { transitionTypes: stepTransition(STEP.workout, STEP.review) });
    }
  }

  function submit(text: string) {
    if (wod && wodEdited(wod.parts)) setPending(text);
    else void breakDown(text);
  }

  return (
    <FlowPage
      step={STEP.workout}
      reachable={reachableStep(wod)}
      board={
        <>
          {reading && (
            <WodBoard {...partsBoard(progress.outline ?? [])} writing={!progress.outline} />
          )}
          {/* Hidden, not unmounted, while parsing, so the text is still there if it fails. */}
          <Activity mode={reading ? "hidden" : "visible"}>
            {/* Remount once the saved workout is read, so the text box starts with its text. */}
            <WodInputForm
              key={restored ? "restored" : "server"}
              loading={loading}
              parsedText={parsedText}
              continueTo={wod ? WOD_STEPS[STEP.review].href : undefined}
              onSubmit={submit}
            />
            {error && <Alert className="mt-4">{error}</Alert>}
          </Activity>
        </>
      }
    >
      {reading ? <ParseProgress progress={progress} /> : <Welcome />}

      <Dialog
        open={pending !== null}
        title="Break down the new workout?"
        onClose={() => setPending(null)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setPending(null)} data-autofocus>
              Keep my changes
            </Button>
            <Button onClick={() => void breakDown(pending!)}>Break it down</Button>
          </>
        }
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          You&apos;ve made changes to the current workout. Breaking down the new one replaces it,
          and your changes are lost.
        </p>
      </Dialog>
    </FlowPage>
  );
}
