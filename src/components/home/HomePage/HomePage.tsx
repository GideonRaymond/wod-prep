"use client";

import { WodInputForm } from "@/components/home/WodInputForm";
import { WodSummary } from "@/components/home/WodSummary";
import { Alert } from "@/components/shared/Alert";
import { useParseWod } from "@/hooks/useParseWod";

export function HomePage() {
  const { wod, setWod, error, loading, parse } = useParseWod();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">WOD Prep</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Paste today&apos;s workout to break it down by movement.
      </p>

      <WodInputForm loading={loading} onSubmit={parse} />

      {error && <Alert className="mt-6">{error}</Alert>}

      {wod && <WodSummary wod={wod} onChange={setWod} />}
    </main>
  );
}
