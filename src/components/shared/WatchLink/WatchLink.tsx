import { Play } from "lucide-react";
import type { ReferenceVideo } from "@/schemas/videos";
import { cn } from "@/utils/cn";
import { READ_LINK_COLORS } from "@/styles/linkStyles";

/** A "Watch" pill linking to a video of something (a movement, a stretch), opening in a new tab. */
export function WatchLink({ name, video }: { name: string; video: ReferenceVideo }) {
  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Watch ${name}: ${video.title}${video.duration ? ` (${video.duration})` : ""}`}
      title={video.title}
      className={cn(
        "bg-accent-faint inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium whitespace-nowrap underline-offset-2 hover:underline",
        READ_LINK_COLORS,
      )}
    >
      <Play size={14} aria-hidden />
      Watch
      {video.duration && (
        <span className="text-subtle font-normal tabular-nums">{video.duration}</span>
      )}
    </a>
  );
}
