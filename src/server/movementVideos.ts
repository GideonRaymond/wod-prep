import "server-only";
import { z } from "zod";
import { ReferenceVideosSchema, type ReferenceVideo } from "@/schemas/videos";
import { normalizeMovementName } from "@/utils/normalizeMovementName";
import { createFileCache } from "./fileCache";

/** Bump when the search or ranking changes, so old results are searched again. */
export const VIDEOS_CACHE_VERSION = 1;

/** How many videos to show per movement. */
export const VIDEOS_PER_MOVEMENT = 3;

/** Longer videos are usually full workouts or livestreams, not movement demos. */
const MAX_DURATION_SECONDS = 20 * 60;

/** The official CrossFit channel's demos come first. */
const PREFERRED_CHANNEL = "CrossFit";

const API = "https://www.googleapis.com/youtube/v3";

/** Videos for a movement rarely change, so a search is reused for a month before it's refreshed. */
export const VIDEOS_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const CacheEntrySchema = z.object({ savedAt: z.number(), videos: ReferenceVideosSchema });

const cache = createFileCache("movement-videos", CacheEntrySchema);
const cacheKey = (name: string) => `v${VIDEOS_CACHE_VERSION}:${normalizeMovementName(name)}`;

/** Cached videos for a movement, or null when there are none or they're over a month old. */
export async function getCachedVideos(name: string): Promise<ReferenceVideo[] | null> {
  const entry = await cache.get(cacheKey(name));
  if (!entry || Date.now() - entry.savedAt > VIDEOS_MAX_AGE_MS) return null;
  return entry.videos;
}

export function cacheVideos(name: string, videos: ReferenceVideo[]) {
  return cache.set(cacheKey(name), { savedAt: Date.now(), videos });
}

/** A YouTube API error; `reason` is YouTube's code, e.g. "quotaExceeded" or "keyInvalid". */
export class YouTubeError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly reason?: string,
  ) {
    super(message);
  }
}

const SearchSchema = z.object({
  items: z.array(
    z.object({
      id: z.object({ videoId: z.string() }),
      snippet: z.object({ title: z.string(), channelTitle: z.string() }),
    }),
  ),
});

const DetailsSchema = z.object({
  items: z.array(z.object({ id: z.string(), contentDetails: z.object({ duration: z.string() }) })),
});

const ErrorSchema = z.object({
  error: z.object({
    message: z.string(),
    errors: z.array(z.object({ reason: z.string() })).optional(),
  }),
});

async function youtube<T>(endpoint: string, params: Record<string, string>, schema: z.ZodType<T>) {
  const query = new URLSearchParams({ ...params, key: process.env.YOUTUBE_API_KEY ?? "" });
  const res = await fetch(`${API}/${endpoint}?${query}`);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const error = ErrorSchema.safeParse(data);
    throw new YouTubeError(
      error.success ? error.data.error.message : `YouTube returned ${res.status}.`,
      res.status,
      error.success ? error.data.error.errors?.[0]?.reason : undefined,
    );
  }
  return schema.parse(data);
}

/**
 * Searches YouTube for demos of a movement: the official CrossFit channel first, then the rest in
 * YouTube's order, skipping livestreams and videos over 20 minutes.
 */
export async function searchMovementVideos(name: string): Promise<ReferenceVideo[]> {
  const search = await youtube(
    "search",
    {
      part: "snippet",
      type: "video",
      q: `${name} CrossFit how to`,
      maxResults: "10",
      safeSearch: "strict",
      relevanceLanguage: "en",
    },
    SearchSchema,
  );
  if (search.items.length === 0) return [];

  const ids = search.items.map((item) => item.id.videoId);
  const details = await youtube(
    "videos",
    { part: "contentDetails", id: ids.join(",") },
    DetailsSchema,
  );
  const seconds = new Map(
    details.items.map((item) => [item.id, parseDuration(item.contentDetails.duration)]),
  );

  return search.items
    .filter((item) => {
      const length = seconds.get(item.id.videoId);
      return length !== undefined && length > 0 && length <= MAX_DURATION_SECONDS;
    })
    .sort(
      (a, b) =>
        Number(b.snippet.channelTitle === PREFERRED_CHANNEL) -
        Number(a.snippet.channelTitle === PREFERRED_CHANNEL),
    )
    .slice(0, VIDEOS_PER_MOVEMENT)
    .map((item) => ({
      title: decodeEntities(item.snippet.title),
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      duration: formatDuration(seconds.get(item.id.videoId)!),
    }));
}

/** Seconds in an ISO 8601 duration like "PT1H2M3S"; 0 for livestreams ("P0D") and anything else. */
export function parseDuration(iso: string) {
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(iso);
  if (!match) return 0;
  const [days, hours, minutes, secs] = match.slice(1).map((n) => Number(n ?? 0));
  return ((days * 24 + hours) * 60 + minutes) * 60 + secs;
}

/** "3:05", or "1:02:03" for an hour or more. */
export function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = String(seconds % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

/** YouTube's API HTML-escapes titles ("Rock &amp; Roll", "Don&#39;t"). */
export function decodeEntities(text: string) {
  return text.replace(/&(#x?[\da-f]+|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] !== "#") return ENTITIES[code.toLowerCase()] ?? entity;
    const hex = code[1]?.toLowerCase() === "x";
    return String.fromCodePoint(parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10));
  });
}
