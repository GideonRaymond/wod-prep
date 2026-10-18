import type { ReferenceVideo } from "@/schemas/videos";

/** Fetches reference videos for a movement. Throws an Error with a user-facing message. */
export async function requestMovementVideos(name: string): Promise<ReferenceVideo[]> {
  const res = await fetch("/api/videos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
  return data.videos;
}
