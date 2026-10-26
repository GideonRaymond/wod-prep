import { BookOpen, ExternalLink, Play, type LucideIcon } from "lucide-react";
import type { ReferenceArticle, ReferenceVideo, WorkoutPartState } from "@/types/wod";
import { cn } from "@/utils/cn";
import { READ_LINK_COLORS } from "@/styles/linkStyles";

type Reference = {
  key: string;
  icon: LucideIcon;
  title: string;
  url: string;
  meta: string[];
  /** Why it's worth reading or watching, when Claude picked it. */
  note?: string;
};

const VIDEOS_PER_WORKOUT = 2;
const present = (x: string | undefined | null): x is string => Boolean(x);

/**
 * What to read and watch before class: the articles for any part, and the general videos about
 * named workouts like "Fran" (a movement's own video is its Watch link further down).
 */
export function beforeClassReferences(parts: WorkoutPartState[]) {
  const articles: (ReferenceArticle & { about: string })[] = parts.flatMap((part) =>
    (part.articles ?? []).map((article) => ({ ...article, about: part.title })),
  );
  const videos: (ReferenceVideo & { about: string })[] = parts.flatMap((part) =>
    part.named
      ? (part.videos ?? [])
          .slice(0, VIDEOS_PER_WORKOUT)
          .map((video) => ({ ...video, about: part.title }))
      : [],
  );
  return { articles, videos };
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** "2 articles · 1 video", or "" when there's nothing yet. */
export function beforeClassCounts(parts: WorkoutPartState[]) {
  const { articles, videos } = beforeClassReferences(parts);
  return [
    articles.length && plural(articles.length, "article"),
    videos.length && plural(videos.length, "video"),
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Reading ("Read") and general videos ("Watch") for the class on a faint purple ground: side by
 * side from the sm breakpoint, stacked on phones.
 */
export function BeforeClass({ parts }: { parts: WorkoutPartState[] }) {
  const references = beforeClassReferences(parts);
  const articles: Reference[] = references.articles.map((a) => ({
    key: a.url,
    icon: BookOpen,
    title: a.title,
    url: a.url,
    meta: [
      "Article",
      a.source,
      a.minutes ? `${a.minutes} min read` : undefined,
      a.members ? "Login needed" : undefined,
    ].filter(present),
    note: a.reason,
  }));
  const videos: Reference[] = references.videos.map((v) => ({
    key: v.url,
    icon: Play,
    title: v.title,
    url: v.url,
    meta: ["Video", v.duration, v.about].filter(present),
    note: v.reason,
  }));

  if (articles.length === 0 && videos.length === 0) {
    return (
      <p className="bg-accent-faint text-subtle rounded-lg px-4 py-3 text-sm">
        Reading and videos for this class show up here once they&apos;re found.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "bg-accent-faint grid gap-x-6 gap-y-3 rounded-lg px-4 pt-3 pb-2",
        articles.length > 0 && videos.length > 0 && "sm:grid-cols-2",
      )}
    >
      <ReferenceList title="Read" items={articles} />
      <ReferenceList title="Watch" items={videos} />
    </div>
  );
}

function ReferenceList({ title, items }: { title: string; items: Reference[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">{title}</h3>
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {items.map(({ key, icon: Icon, title: itemTitle, url, meta, note }) => (
          // Room on the left for the icon, which is inside the link so it turns pink with it once
          // opened (visited colours only reach the link itself), placed level with its first line.
          <li key={key} className="relative py-2 pl-7 text-sm">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("font-medium underline-offset-2 hover:underline", READ_LINK_COLORS)}
            >
              <Icon size={16} aria-hidden className="absolute top-2.5 left-0" />
              {itemTitle}
              <ExternalLink size={12} aria-hidden className="ml-1 inline align-[-1px]" />
            </a>
            <p className="text-subtle text-xs">{meta.join(" · ")}</p>
            {note && <p className="text-xs text-zinc-600 dark:text-zinc-400">{note}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
