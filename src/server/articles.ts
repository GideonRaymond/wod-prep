import "server-only";
import type { BetaContentBlock, BetaMessageParam } from "@anthropic-ai/sdk/resources/beta";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import {
  ARTICLE_ANGLES,
  ReferenceArticlesSchema,
  type ArticleRequest,
  type ReferenceArticle,
} from "@/schemas/articles";
import { anthropic, MODEL } from "./anthropic";
import { UnusableResultError } from "./apiErrors";
import { createFileCache } from "./fileCache";
import { normalizeWodText } from "./wodCache";

/** Bump when the prompt or output changes, so old reading lists are searched again. */
export const ARTICLES_CACHE_VERSION = 2;

/** Reading for a workout rarely changes, so a search is reused for a month like videos. */
export const ARTICLES_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export const MAX_ARTICLES = 3;

/** A long search can pause partway; it's resumed at most this many times. */
const MAX_CONTINUATIONS = 3;

const CacheEntrySchema = z.object({ savedAt: z.number(), articles: ReferenceArticlesSchema });
const cache = createFileCache("articles", CacheEntrySchema);

/**
 * Named workouts get the same reading whatever their notes say; other parts share reading when
 * they have the same format, scheme and movements. Both also need the same intensity, which steers
 * the pick. The stimulus text is left out because it's written fresh for every parse.
 */
export function articlesCacheKey(part: ArticleRequest) {
  const about = part.named
    ? `named ${part.title}`
    : [
        part.format,
        part.rounds,
        part.duration,
        ...part.movements.map((m) => [m.reps, m.load, m.name].filter(Boolean).join(" ")),
      ]
        .filter(Boolean)
        .join(" ");
  return `v${ARTICLES_CACHE_VERSION}:${normalizeWodText(`${about} intensity ${part.intensity}`)}`;
}

/** Cached articles for a workout part, or null when there are none or they're over a month old. */
export async function getCachedArticles(part: ArticleRequest) {
  const entry = await cache.get(articlesCacheKey(part));
  if (!entry || Date.now() - entry.savedAt > ARTICLES_MAX_AGE_MS) return null;
  return entry.articles;
}

export function cacheArticles(part: ArticleRequest, articles: ReferenceArticle[]) {
  return cache.set(articlesCacheKey(part), { savedAt: Date.now(), articles });
}

const PicksSchema = z.object({
  articles: z.array(
    z.object({
      title: z.string(),
      url: z.string().describe("The page's exact URL, as it appeared in your search or fetch"),
      source: z.string().describe('The site or publication, e.g. "CrossFit Journal"'),
      minutes: z.number().int().nullable().describe("Estimated reading time, if you opened it"),
      angle: z.enum(ARTICLE_ANGLES),
      reason: z.string().describe("Why it's worth reading before this workout, one sentence"),
      members: z.boolean().describe("True when it needs a login to read"),
    }),
  ),
});

const SYSTEM = `You're a well-read CrossFit coach putting together a short reading list for athletes before class. You get one part of today's workout. Find up to ${MAX_ARTICLES} articles worth reading before it, best first.

Aim for a mix of angles, at most one of each:
- mechanics: why we do one of its movements, or the mechanics at work in it. Not a generic "how to" or cue list.
- energy: the energy system, pacing, recovery or fuel this workout depends on, e.g. VO2 max for a 2k row, zone 2 for long aerobic work, eating and recovering around a long grind.
- tie-in: something surprising but genuinely connected to this workout: its history, the idea behind it, or a related piece of science.

The stimulus and intensity (1 to 10) are the coach's, so take them as right, even where you'd read the workout differently: they decide what the workout is about. If they contradict each other, go by the harder of the two.

Before searching, think about what this workout is really about: its time domain, what will limit athletes, and which movement matters most. Search for that, not for the movement names alone.

Where to look:
- Prefer CrossFit's own writing: crossfit.com articles and essentials, and the CrossFit Journal. Many Journal articles are free as PDFs at library.crossfit.com/free/pdf/.
- Articles on journal.crossfit.com need a login, so you can't open them. Pick one only when its title and description in the search results make clear it fits, and set members to true. Use the free library.crossfit.com copy instead when there is one.
- Then established coaching, physiology and sports-science writers with real depth.
- Never use unofficial copies of CrossFit Journal articles.

Open each page before picking it, except members-only Journal articles. Skip listicles, product pages, forums, paywalled sites (other than the Journal), medical advice, and anything you couldn't confirm is about this workout's subject.

For each pick, give its exact URL from your search or fetch results, its title, the site or publication, the reading time in minutes if you opened it, its angle, and in one sentence of at most 25 words why it's worth reading before this workout in particular. Fewer is better than filler: return an empty list if nothing is good enough.`;

/** Every URL that came back from a search, fetch or filtering step (the final answer excluded). */
function foundUrls(content: BetaContentBlock[]) {
  const results = JSON.stringify(content.filter((block) => block.type !== "text"));
  return new Set((results.match(/https?:\/\/[^\s"'<>\\)]+/g) ?? []).map(normalizeUrl));
}

const normalizeUrl = (url: string) =>
  url
    .replace(/[#?].*$/, "")
    .replace(/\/+$/, "")
    .toLowerCase();

/**
 * Asks Claude to search the web and pick a few articles to read before a workout part, best first.
 * Only articles whose URL came back from its searches are kept, so a made-up link never shows.
 */
export async function findArticles(part: ArticleRequest): Promise<ReferenceArticle[]> {
  const messages: BetaMessageParam[] = [{ role: "user", content: JSON.stringify(part) }];
  const seen: BetaContentBlock[] = [];

  for (let turn = 0; ; turn++) {
    const response = await anthropic.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: "low", format: betaZodOutputFormat(PicksSchema) },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      tools: [
        { type: "web_search_20260209", name: "web_search", max_uses: 5 },
        { type: "web_fetch_20260209", name: "web_fetch", max_uses: 5 },
      ],
      messages,
    });
    seen.push(...response.content);

    if (response.stop_reason === "pause_turn" && turn < MAX_CONTINUATIONS) {
      messages.push({ role: "assistant", content: response.content });
      continue;
    }
    if (response.stop_reason === "refusal") {
      throw new UnusableResultError("The model declined to find reading for this workout.");
    }
    if (!response.parsed_output) {
      throw new UnusableResultError("Couldn't read the model's reading list.");
    }

    const found = foundUrls(seen);
    const kept = new Set<string>();
    return response.parsed_output.articles
      .filter(({ url }) => {
        const key = normalizeUrl(url);
        if (!/^https?:\/\//i.test(url) || !found.has(key) || kept.has(key)) return false;
        kept.add(key);
        return true;
      })
      .slice(0, MAX_ARTICLES)
      .map(({ minutes, members, ...article }) => ({
        ...article,
        ...(minutes && { minutes }),
        ...(members && { members }),
      }));
  }
}
