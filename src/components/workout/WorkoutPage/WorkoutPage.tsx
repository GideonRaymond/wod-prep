"use client";

import { ArrowLeft } from "lucide-react";
import { WorkoutPartDetails } from "@/components/workout/WorkoutPartDetails";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { Card } from "@/components/shared/Card";
import { useWod } from "@/providers/WodProvider";

/** The confirmed workout with the details for each part and movement. */
export function WorkoutPage() {
  const { wod, restored } = useWod();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12">
      <ButtonLink href="/" variant="secondary" size="xs" icon={ArrowLeft} className="-ml-2">
        Back to edit
      </ButtonLink>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Your workout</h1>

      {wod ? (
        <div className="mt-8 space-y-10">
          {wod.parts.map((part, i) => (
            <div
              key={part.id}
              className={i > 0 ? "border-t border-zinc-200 pt-10 dark:border-zinc-800" : undefined}
            >
              <WorkoutPartDetails part={part} />
            </div>
          ))}
        </div>
      ) : (
        restored && (
          <Card className="mt-8">
            <p className="text-zinc-600 dark:text-zinc-400">There&apos;s no workout to show yet.</p>
            <ButtonLink href="/" size="sm" className="mt-3">
              Paste a workout
            </ButtonLink>
          </Card>
        )
      )}
    </main>
  );
}
