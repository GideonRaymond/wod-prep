import "server-only";
import { WodSchema, type Wod } from "@/schemas/wod";
import { createFileCache } from "./fileCache";

/** Bump when the parser prompt or schema changes, so old results get parsed again. */
export const CACHE_VERSION = 1;

const cache = createFileCache("parsed-wods", WodSchema);

/**
 * Reduces WOD text to its letters and numbers so formatting doesn't matter:
 * case, punctuation, quotes, line breaks and hyphens are ignored ("Pull-ups" = "pullups"),
 * while separate numbers stay separate ("21-15-9" ≠ "21159").
 */
export function normalizeWodText(text: string) {
  const tokens = text.toLowerCase().match(/[a-z]+|\d+(?:\.\d+)?/g) ?? [];
  return tokens.reduce((key, token, i) => {
    const bothNumbers = i > 0 && /\d$/.test(tokens[i - 1]) && /^\d/.test(token);
    return key + (bothNumbers ? "|" : "") + token;
  }, "");
}

const keyFor = (text: string) => `v${CACHE_VERSION}:${normalizeWodText(text)}`;

/** Returns a previously parsed WOD for this text (or this workout's name), if any. */
export function getCachedWod(text: string): Promise<Wod | null> {
  return cache.get(keyFor(text));
}

/**
 * Stores a parsed WOD under the text it came from, and under its name (e.g. "Fran") so typing
 * just the name finds it later. An existing name entry is kept, so the first version wins.
 */
export async function cacheWod(text: string, wod: Wod) {
  await cache.set(keyFor(text), wod);
  if (wod.title) await cache.setIfMissing(keyFor(wod.title), wod);
}
