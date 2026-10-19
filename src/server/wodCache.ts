import "server-only";
import { WodSchema, type Wod } from "@/schemas/wod";
import { fillMissingLabels } from "@/utils/fillMissingLabels";
import { createFileCache } from "./fileCache";

/** Bump when the parser prompt or schema changes, so old results get parsed again. */
export const CACHE_VERSION = 6;

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
export async function getCachedWod(text: string): Promise<Wod | null> {
  const wod = await cache.get(keyFor(text));
  // Fixes labels in results cached before missing labels were filled in.
  return wod && { parts: fillMissingLabels(wod.parts) };
}

/**
 * Stores a parsed WOD under the text it came from. Each part of a multi-part WOD is also stored on
 * its own, under that part's text, so pasting just one part later is a hit too.
 *
 * Parts with a real name (e.g. "Fran") are also stored under that name, so typing just the name
 * finds them; the first version wins. Made-up titles like "Intense Couplet" aren't, since they
 * don't identify a workout.
 */
export async function cacheWod(text: string, wod: Wod) {
  await cache.set(keyFor(text), wod);
  for (const part of wod.parts) {
    const alone: Wod = { parts: [{ ...part, label: null }] };
    if (wod.parts.length > 1) await cache.set(keyFor(part.sourceText), alone);
    if (part.named) await cache.setIfMissing(keyFor(part.title), alone);
  }
}
