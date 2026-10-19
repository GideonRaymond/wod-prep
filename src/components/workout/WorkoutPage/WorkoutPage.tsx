"use client";

import { ArrowLeft } from "lucide-react";
import { WorkoutPartDetails } from "@/components/workout/WorkoutPartDetails";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { Card } from "@/components/shared/Card";
import { useArticles } from "@/hooks/useArticles";
import { useMovementVideos } from "@/hooks/useMovementVideos";
import { useWod } from "@/providers/WodProvider";

/** The confirmed workout with the details for each part and movement. */
export function WorkoutPage() {
  const { wod, restored } = useWod();
  const videos = useMovementVideos();
  const articles = useArticles();
  const finding = [videos.loading && "videos", articles.loading && "reading"].filter(Boolean);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12">
      <ButtonLink href="/" variant="secondary" size="xs" icon={ArrowLeft} className="-ml-2">
        Back to edit
      </ButtonLink>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Your workout</h1>
      {wod && finding.length > 0 && (
        <p role="status" className="text-subtle mt-1 text-sm">
          Finding {finding.join(" and ")}…
        </p>
      )}
      {videos.error && <p className="text-subtle mt-1 text-sm">{videos.error}</p>}
      {articles.error && <p className="text-subtle mt-1 text-sm">{articles.error}</p>}

      {wod ? (
        <div className="mt-8">
          {wod.parts.map((part, i) => (
            <WorkoutPartDetails
              key={part.id}
              part={part}
              defaultOpen={i === 0}
              only={wod.parts.length === 1}
              last={i === wod.parts.length - 1}
            />
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
