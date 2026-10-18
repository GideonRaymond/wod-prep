import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { WodSchema, type Wod } from "@/schemas/wod";

/** Bump when the parser prompt or schema changes, so old results get parsed again. */
export const CACHE_VERSION = 1;

type CacheFile = Record<string, unknown>;

/** On by default in development; set WOD_CACHE=on/off to override. */
export function isCacheEnabled() {
  if (process.env.WOD_CACHE === "on") return true;
  if (process.env.WOD_CACHE === "off") return false;
  return process.env.NODE_ENV !== "production";
}

function cacheFilePath() {
  return process.env.WOD_CACHE_FILE ?? path.join(process.cwd(), ".cache", "parsed-wods.json");
}

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

async function readCache(): Promise<CacheFile> {
  try {
    return JSON.parse(await readFile(cacheFilePath(), "utf8"));
  } catch {
    return {};
  }
}

/** Returns a previously parsed WOD for this text (or this workout's name), if any. */
export async function getCachedWod(text: string): Promise<Wod | null> {
  if (!isCacheEnabled()) return null;
  const entry = (await readCache())[keyFor(text)];
  const parsed = WodSchema.safeParse(entry);
  return parsed.success ? parsed.data : null;
}

/**
 * Stores a parsed WOD under the text it came from, and under its name (e.g. "Fran") so typing
 * just the name finds it later. An existing name entry is kept, so the first version wins.
 */
export async function cacheWod(text: string, wod: Wod) {
  if (!isCacheEnabled()) return;
  try {
    const cache = await readCache();
    cache[keyFor(text)] = wod;
    if (wod.title) {
      const titleKey = keyFor(wod.title);
      cache[titleKey] ??= wod;
    }
    const file = cacheFilePath();
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify(cache, null, 2));
  } catch (err) {
    // A cache that can't be written (e.g. a read-only filesystem) shouldn't break parsing.
    console.warn("Couldn't write the WOD cache:", err);
  }
}
