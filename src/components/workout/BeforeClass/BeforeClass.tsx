"use client";

import { useId, useState } from "react";
import { BookOpen, ChevronDown, ExternalLink, Play, type LucideIcon } from "lucide-react";
import type { WorkoutPartState } from "@/types/wod";
import { cn } from "@/utils/cn";
import { pickVideos } from "./pickVideos";
import { referenceCounts } from "./referenceCounts";

type Reference = {
  key: string;
  icon: LucideIcon;
  title: string;
  url: string;
  meta: string[];
  /** Why it's worth reading or watching, when Claude picked it. */
  note?: string;
};

/**
 * Reading and watching for a workout part: its articles ("Read") and a short pick of videos
 * ("Watch"), side by side on a faint purple ground. It folds on its own and renders nothing
 * while a part has no reference material.
 */
export function BeforeClass({ part }: { part: WorkoutPartState }) {
  const [open, setOpen] = useState(true);
  const panelId = useId();

  const articles: Reference[] = (part.articles ?? []).map((a, i) => ({
    key: `a${i}`,
    icon: BookOpen,
    title: a.title,
    url: a.url,
    meta: [
      "Article",
      a.source,
      a.minutes ? `${a.minutes} min read` : undefined,
      a.members ? "Login needed" : undefined,
    ].filter((x): x is string => Boolean(x)),
    note: a.reason,
  }));
  const videos: Reference[] = pickVideos(part).map((v) => ({
    key: v.url,
    icon: Play,
    title: v.title,
    url: v.url,
    meta: ["Video", v.duration, v.about].filter((x): x is string => Boolean(x)),
    note: v.reason,
  }));
  if (articles.length === 0 && videos.length === 0) return null;

  return (
    <div className="bg-accent-faint rounded-lg px-4 pt-3 pb-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-2 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 dark:focus-visible:outline-purple-400"
      >
        <span className="text-sm font-semibold text-purple-800 dark:text-purple-200">
          Before class
        </span>
        <span className="text-subtle flex-1 text-xs">{referenceCounts(part)}</span>
        <ChevronDown
          size={16}
          aria-hidden
          className={cn(
            "text-zinc-600 transition-transform dark:text-zinc-400",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        id={panelId}
        hidden={!open}
        className={cn(
          "mt-4 grid gap-x-6 gap-y-3",
          articles.length > 0 && videos.length > 0 && "sm:grid-cols-2",
        )}
      >
        <ReferenceList title="Read" items={articles} />
        <ReferenceList title="Watch" items={videos} />
      </div>
    </div>
  );
}

function ReferenceList({ title, items }: { title: string; items: Reference[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">{title}</h4>
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {items.map(({ key, icon: Icon, title: itemTitle, url, meta, note }) => (
          <li key={key} className="flex items-start gap-3 py-2">
            <Icon
              size={16}
              aria-hidden
              className="mt-0.5 shrink-0 text-purple-700 dark:text-purple-300"
            />
            <div>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-purple-700 underline-offset-2 hover:underline dark:text-purple-300"
              >
                {itemTitle}
                <ExternalLink size={12} aria-hidden className="ml-1 inline align-[-1px]" />
              </a>
              <p className="text-subtle text-xs">{meta.join(" · ")}</p>
              {note && <p className="text-xs text-zinc-600 dark:text-zinc-400">{note}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
