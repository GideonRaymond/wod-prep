import type { ReferenceVideo, VideoKind } from "@/schemas/videos";
import { fetchWithLogin } from "./fetchWithLogin";

/** Fetches reference videos for a movement or named workout. Throws an Error with a user-facing message. */
export async function requestMovementVideos(
  name: string,
  kind: VideoKind = "movement",
): Promise<ReferenceVideo[]> {
  const res = await fetchWithLogin("/api/videos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, kind }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
  return data.videos;
}
