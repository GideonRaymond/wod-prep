import { Play } from "lucide-react";
import type { ReferenceVideo } from "@/schemas/videos";

/** A "Watch" pill linking to a video of something (a movement, a stretch), opening in a new tab. */
export function WatchLink({ name, video }: { name: string; video: ReferenceVideo }) {
  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Watch ${name}: ${video.title}${video.duration ? ` (${video.duration})` : ""}`}
      title={video.title}
      className="bg-accent-faint inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium whitespace-nowrap text-purple-700 underline-offset-2 hover:underline dark:text-purple-300"
    >
      <Play size={14} aria-hidden />
      Watch
      {video.duration && (
        <span className="text-subtle font-normal tabular-nums">{video.duration}</span>
      )}
    </a>
  );
}
