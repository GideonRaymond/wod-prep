import type { ReferenceVideo, WorkoutPartState } from "@/types/wod";

/** A video to show in Before class, with what it's about (a movement or the workout's name). */
export type PickedVideo = ReferenceVideo & { about: string };

/**
 * Picks a short, varied list of videos for a part, from the best-ranked ones found:
 * - one video about the workout itself when it's a named workout like "Fran" or "Murph";
 * - one per movement (two when the part has just one movement, e.g. a run);
 * - never the same video twice, so a movement falls back to its next video if its first is taken.
 */
export function pickVideos(part: WorkoutPartState): PickedVideo[] {
  const picked: PickedVideo[] = [];
  const used = new Set<string>();
  const take = (videos: ReferenceVideo[] | undefined, count: number, about: string) => {
    for (const video of (videos ?? []).filter((v) => !used.has(v.url)).slice(0, count)) {
      used.add(video.url);
      picked.push({ ...video, about });
    }
  };

  if (part.named) take(part.videos, 1, part.title);
  const perMovement = part.movements.length === 1 ? 2 : 1;
  for (const movement of part.movements) take(movement.videos, perMovement, movement.name);
  return picked;
}
