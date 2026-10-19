"use client";

import { Activity, useState } from "react";
import { useRouter } from "next/navigation";
import { ParseProgress } from "@/components/home/ParseProgress";
import { Welcome } from "@/components/home/Welcome";
import { WodInputForm } from "@/components/home/WodInputForm";
import { Alert } from "@/components/shared/Alert";
import { Button } from "@/components/shared/Button";
import { Dialog } from "@/components/shared/Dialog";
import { FlowPage } from "@/components/shared/FlowPage";
import { WodBoard } from "@/components/shared/WodBoard";
import { STEP, WOD_STEPS } from "@/constants/flow";
import { useParseWod } from "@/hooks/useParseWod";
import { partsBoard } from "@/utils/boardItems";
import { wodEdited } from "@/utils/partKey";

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

  async function breakDown(text: string) {
    setPending(null);
    if (await parse(text)) router.push(WOD_STEPS[STEP.review].href);
  }

  function submit(text: string) {
    if (wod && wodEdited(wod.parts)) setPending(text);
    else void breakDown(text);
  }

  return (
    <FlowPage
      step={STEP.workout}
      reachable={wod ? STEP.review : undefined}
      board={
        <>
          {loading && (
            <WodBoard {...partsBoard(progress.outline ?? [])} writing={!progress.outline} />
          )}
          {/* Hidden, not unmounted, while parsing, so the text is still there if it fails. A
              hidden Activity (unlike the hidden attribute) also stops its board counting as a
              second board for the page transition. */}
          <Activity mode={loading ? "hidden" : "visible"}>
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
      {loading ? <ParseProgress progress={progress} /> : <Welcome />}

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
