import "server-only";
import { EXAMPLE_WOD } from "@/constants/wod";
import { toArticleRequest } from "@/services/articlesApi";
import { toPrepRequest } from "@/services/classPrepApi";
import { toWodState } from "@/utils/toWodState";
import { cacheArticles, findArticles, getCachedArticles } from "./articles";
import { cachePrep, getCachedPrep, planPrep } from "./classPrep";
import { cacheVideos, findCuratedVideo, findVideos, getCachedVideos } from "./movementVideos";
import { parseWod } from "./parseWod";
import {
  cachePoints,
  findCuratedPoints,
  generatePoints,
  getCachedPoints,
} from "./pointsOfPerformance";
import { cacheWod, getCachedWod } from "./wodCache";

/**
 * Goes through everything the class page asks for when the example workout is broken down and
 * left as it is (the parse, the warm-up plan, reading per part, videos and points of performance
 * per movement), in the order the pages ask, the way the API routes look it up. Returns what isn't
 * cached. With `fill`, it makes what's missing (calling Claude and YouTube) and caches it instead.
 *
 * The test in exampleCache.test.ts checks nothing is missing from the seed in
 * src/data/exampleCache.json; `npm run seed:example` remakes that seed with `fill`.
 */
export async function lookUpExample({ fill = false } = {}): Promise<string[]> {
  const missing: string[] = [];
  /** Looks one result up, making it when it's missing and we're filling. */
  async function need<T>(what: string, cached: () => Promise<T | null>, make: () => Promise<T>) {
    const found = await cached();
    if (found !== null) return found;
    if (!fill) {
      missing.push(what);
      return null;
    }
    console.log(`Making ${what}…`);
    return make();
  }

  const wod = await need(
    "the parse",
    () => getCachedWod(EXAMPLE_WOD),
    async () => {
      const parsed = await parseWod(EXAMPLE_WOD);
      await cacheWod(EXAMPLE_WOD, parsed);
      return parsed;
    },
  );
  if (!wod) return missing;
  const state = toWodState(wod);

  const prepRequest = toPrepRequest(state);
  await need(
    "the class plan",
    () => getCachedPrep(prepRequest),
    async () => {
      const prep = await planPrep(prepRequest);
      await cachePrep(prepRequest, prep);
      return prep;
    },
  );

  for (const part of state.parts.filter((p) => p.movements.length > 0)) {
    const request = toArticleRequest(part);
    await need(
      `reading for ${part.title}`,
      () => getCachedArticles(request),
      async () => {
        const articles = await findArticles(request);
        await cacheArticles(request, articles);
        return articles;
      },
    );
  }

  const searches = state.parts.flatMap((part) => [
    ...(part.named ? [{ name: part.title, kind: "workout" as const }] : []),
    ...part.movements.map((m) => ({ name: m.name, kind: "movement" as const })),
  ]);
  for (const { name, kind } of searches) {
    if (kind === "movement" && findCuratedVideo(name)) continue;
    await need(
      `videos for ${name}`,
      () => getCachedVideos(name, kind),
      async () => {
        const videos = await findVideos(name, kind);
        await cacheVideos(name, videos, kind);
        return videos;
      },
    );
  }

  for (const { name } of state.parts.flatMap((part) => part.movements)) {
    if (findCuratedPoints(name)) continue;
    await need(
      `points of performance for ${name}`,
      () => getCachedPoints(name),
      async () => {
        const points = await generatePoints(name);
        await cachePoints(name, points);
        return points;
      },
    );
  }

  return missing;
}
