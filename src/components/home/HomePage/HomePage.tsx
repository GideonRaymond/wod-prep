"use client";

import { useRouter } from "next/navigation";
import { WodInputForm } from "@/components/home/WodInputForm";
import { WodSummary } from "@/components/home/WodSummary";
import { Alert } from "@/components/shared/Alert";
import { Button } from "@/components/shared/Button";
import { useParseWod } from "@/hooks/useParseWod";

export function HomePage() {
  const router = useRouter();
  const { wod, setWod, error, loading, parsedText, restored, parse } = useParseWod();
  const missingStimulus = wod?.parts.some((part) => !part.stimulus.description.trim());

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">WOD Prep</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Paste today&apos;s workout, check that everything looks right, then confirm it.
      </p>

      {/* Remount once the saved workout is read, so the text box starts with its text. */}
      <WodInputForm
        key={restored ? "restored" : "server"}
        loading={loading}
        parsedText={parsedText}
        onSubmit={parse}
      />

      {error && <Alert className="mt-6">{error}</Alert>}

      {wod && (
        <>
          <WodSummary wod={wod} onChange={setWod} />
          <div className="mt-10 flex flex-col items-end gap-2 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <Button
              onClick={() => router.push("/workout")}
              disabled={missingStimulus}
              aria-describedby={missingStimulus ? "confirm-hint" : undefined}
            >
              Confirm workout
            </Button>
            {missingStimulus && (
              <p id="confirm-hint" className="text-sm text-zinc-500">
                Every part needs a stimulus before you can confirm.
              </p>
            )}
          </div>
        </>
      )}
    </main>
  );
}
