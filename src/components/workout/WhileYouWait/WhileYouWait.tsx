import { useId } from "react";
import { BookOpen, ExternalLink, Play } from "lucide-react";
import type { ReferenceArticle, ReferenceVideo } from "@/types/wod";

export type WhileYouWaitProps = {
  articles: (ReferenceArticle & { about: string })[];
  videos: (ReferenceVideo & { about: string })[];
  /** The pointer or keyboard focus moved into the list (true) or out of it (false). */
  onReading?: (reading: boolean) => void;
};

/**
 * The Before class reading and videos, shown on the loading screen as soon as they arrive. Links
 * open in a new tab, so the class keeps building. While the pointer or focus is on the list, the
 * page knows someone is reading (to hold the countdown to the class).
 */
export function WhileYouWait({ articles, videos, onReading }: WhileYouWaitProps) {
  const titleId = useId();
  const items = [
    ...articles.map((a) => ({
      key: a.url,
      icon: BookOpen,
      title: a.title,
      url: a.url,
      meta: ["Article", a.source, a.minutes ? `${a.minutes} min read` : null],
    })),
    ...videos.map((v) => ({
      key: v.url,
      icon: Play,
      title: v.title,
      url: v.url,
      meta: ["Video", v.duration, v.about],
    })),
  ];
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby={titleId}
      onPointerEnter={() => onReading?.(true)}
      onPointerLeave={() => onReading?.(false)}
      onFocus={() => onReading?.(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) onReading?.(false);
      }}
      className="bg-accent-faint motion-safe:animate-rise-in mt-4 rounded-lg px-4 pt-3 pb-2"
    >
      <h2 id={titleId} className="text-sm font-semibold text-purple-800 dark:text-purple-200">
        Maybe while you wait
      </h2>
      <p className="text-subtle text-xs">Opens in a new tab; your class keeps building here.</p>
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {items.map(({ key, icon: Icon, title, url, meta }) => (
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
                {title}
                <ExternalLink size={12} aria-hidden className="ml-1 inline align-[-1px]" />
              </a>
              <p className="text-subtle text-xs">{meta.filter(Boolean).join(" · ")}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
