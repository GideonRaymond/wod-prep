import { useId } from "react";
import { BookOpen, ExternalLink, Play } from "lucide-react";
import { cn } from "@/utils/cn";
import { READ_LINK_COLORS } from "@/styles/linkStyles";

/** A video or article to look at while the class builds. */
export type WaitingReference = {
  kind: "video" | "article";
  title: string;
  url: string;
  /** "Video · 3:40 · Fran", as parts. */
  meta: string[];
};

export type WhileYouWaitProps = {
  references: WaitingReference[];
  /** The pointer or keyboard focus moved into the list (true) or out of it (false). */
  onReading?: (reading: boolean) => void;
};

/**
 * A few videos and articles to look at while the class builds, under the whiteboard. Links open in
 * a new tab, so the class keeps building. While the pointer or focus is on the list, the page knows
 * someone is reading (to hold the countdown to the class). Renders nothing until there's something.
 */
export function WhileYouWait({ references, onReading }: WhileYouWaitProps) {
  const titleId = useId();
  if (references.length === 0) return null;

  return (
    <section
      aria-labelledby={titleId}
      onPointerEnter={() => onReading?.(true)}
      onPointerLeave={() => onReading?.(false)}
      onFocus={() => onReading?.(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) onReading?.(false);
      }}
      className="mt-4"
    >
      <h2 id={titleId} className="text-sm font-semibold">
        While you wait
      </h2>
      <p className="text-subtle text-xs">Opens in a new tab; your class keeps building here.</p>
      <ul className="mt-1 divide-y divide-zinc-100 dark:divide-zinc-800">
        {references.map(({ kind, title, url, meta }) => {
          const Icon = kind === "video" ? Play : BookOpen;
          return (
            <li key={url} className="motion-safe:animate-row-in flex items-start gap-3 py-2">
              <Icon
                size={16}
                aria-hidden
                className="mt-0.5 shrink-0 text-purple-700 dark:text-purple-300"
              />
              {/* The title's text size sets the line height, so the icon lines up with its first line. */}
              <div className="min-w-0 text-sm">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "text-sm font-medium underline-offset-2 hover:underline",
                    READ_LINK_COLORS,
                  )}
                >
                  {title}
                  <ExternalLink size={12} aria-hidden className="ml-1 inline align-[-1px]" />
                </a>
                <p className="text-subtle text-xs">{meta.join(" · ")}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
