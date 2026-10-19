"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ParseProgress } from "@/components/home/ParseProgress";
import { WodInputForm } from "@/components/home/WodInputForm";
import { Alert } from "@/components/shared/Alert";
import { Button } from "@/components/shared/Button";
import { Dialog } from "@/components/shared/Dialog";
import { Stepper } from "@/components/shared/Stepper";
import { STEP, WOD_STEPS } from "@/constants/flow";
import { useParseWod } from "@/hooks/useParseWod";
import { wodEdited } from "@/utils/partKey";

/**
 * The first step: paste a workout and break it down. While it's read, the whiteboard is written
 * up beside a checklist; once it's read, the review page opens. Breaking down a new workout
 * replaces the current one, so it asks first if that one has been edited.
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
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <Stepper steps={WOD_STEPS} current={STEP.workout} reachable={wod ? STEP.review : undefined} />

      <div className="mt-8 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">WOD Prep</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {loading
            ? "Writing it up on the board. This takes a few seconds."
            : "Paste today's workout and we'll break it down."}
        </p>
      </div>

      {loading && <ParseProgress progress={progress} />}
      {/* Hidden, not unmounted, while parsing, so the text is still there if it fails. */}
      <div hidden={loading} className="max-w-2xl">
        {/* Remount once the saved workout is read, so the text box starts with its text. */}
        <WodInputForm
          key={restored ? "restored" : "server"}
          loading={loading}
          parsedText={parsedText}
          continueTo={wod ? WOD_STEPS[STEP.review].href : undefined}
          onSubmit={submit}
        />
        {error && <Alert className="mt-6">{error}</Alert>}
      </div>

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
    </main>
  );
}
