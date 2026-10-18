import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cacheVideos,
  decodeEntities,
  formatDuration,
  getCachedVideos,
  parseDuration,
  VIDEOS_MAX_AGE_MS,
  searchMovementVideos,
  YouTubeError,
} from "./movementVideos";

const fetchMock = vi.fn();

type Result = { id: string; title: string; channel?: string; duration?: string };

/** Answers the search call, then the video details call, like the YouTube API does. */
function youtubeReturns(results: Result[]) {
  fetchMock
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: results.map(({ id, title, channel = "Some Coach" }) => ({
          id: { kind: "youtube#video", videoId: id },
          snippet: { title, channelTitle: channel },
        })),
      }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: results.map(({ id, duration = "PT2M30S" }) => ({
          id,
          contentDetails: { duration },
        })),
      }),
    });
}

const requestedUrl = (call: number) => new URL(fetchMock.mock.calls[call][0]);

describe("searchMovementVideos", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("YOUTUBE_API_KEY", "yt-key");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("searches YouTube for the movement and returns links with durations", async () => {
    youtubeReturns([{ id: "abc", title: "How to Thruster", duration: "PT3M5S" }]);

    await expect(searchMovementVideos("Thruster")).resolves.toEqual([
      { title: "How to Thruster", url: "https://www.youtube.com/watch?v=abc", duration: "3:05" },
    ]);

    const search = requestedUrl(0);
    expect(search.pathname).toBe("/youtube/v3/search");
    expect(search.searchParams.get("q")).toBe("Thruster CrossFit how to");
    expect(search.searchParams.get("type")).toBe("video");
    expect(search.searchParams.get("safeSearch")).toBe("strict");
    expect(search.searchParams.get("key")).toBe("yt-key");

    const details = requestedUrl(1);
    expect(details.pathname).toBe("/youtube/v3/videos");
    expect(details.searchParams.get("id")).toBe("abc");
    expect(details.searchParams.get("part")).toBe("contentDetails");
  });

  it("ranks the CrossFit channel first, then titles naming the movement, then YouTube's order", async () => {
    youtubeReturns([
      { id: "a", title: "Grip tips" },
      { id: "b", title: "Better PULL-UPS fast" },
      { id: "c", title: "Kipping basics", channel: "CrossFit" },
      { id: "d", title: "Pull Up Progressions", channel: "CrossFit" },
      { id: "e", title: "Shoulder warm-up" },
    ]);
    const videos = await searchMovementVideos("Pull-up");
    expect(videos.map((v) => v.title)).toEqual([
      "Pull Up Progressions",
      "Kipping basics",
      "Better PULL-UPS fast",
    ]);
  });

  it("searches for a named workout with its own query", async () => {
    youtubeReturns([{ id: "f", title: "Fran Tips" }]);
    await searchMovementVideos("Fran", "workout");
    expect(requestedUrl(0).searchParams.get("q")).toBe("Fran CrossFit workout");
  });

  it("returns at most three videos", async () => {
    youtubeReturns(["a", "b", "c", "d", "e"].map((id) => ({ id, title: id })));
    await expect(searchMovementVideos("Burpee")).resolves.toHaveLength(3);
  });

  it("skips livestreams and videos over 20 minutes", async () => {
    youtubeReturns([
      { id: "live", title: "Live", duration: "P0D" },
      { id: "long", title: "Full class", duration: "PT45M" },
      { id: "edge", title: "Twenty", duration: "PT20M" },
    ]);
    const videos = await searchMovementVideos("Row");
    expect(videos.map((v) => v.title)).toEqual(["Twenty"]);
  });

  it("decodes HTML entities in titles", async () => {
    youtubeReturns([{ id: "a", title: "Don&#39;t Skip &amp; Squat" }]);
    const [video] = await searchMovementVideos("Air Squat");
    expect(video.title).toBe("Don't Skip & Squat");
  });

  it("skips the details call when nothing is found", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) });
    await expect(searchMovementVideos("Nonsense")).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws a YouTubeError with YouTube's reason", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({
        error: { code: 403, message: "Quota exceeded.", errors: [{ reason: "quotaExceeded" }] },
      }),
    });
    const error = await searchMovementVideos("Thruster").catch((e) => e);
    expect(error).toBeInstanceOf(YouTubeError);
    expect(error).toMatchObject({
      status: 403,
      reason: "quotaExceeded",
      message: "Quota exceeded.",
    });
  });

  it("throws a YouTubeError when the error body isn't YouTube's", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503, json: async () => null });
    await expect(searchMovementVideos("Thruster")).rejects.toMatchObject({
      status: 503,
      reason: undefined,
    });
  });
});

describe("parseDuration", () => {
  it.each([
    ["PT45S", 45],
    ["PT3M5S", 185],
    ["PT1H2M3S", 3723],
    ["PT10M", 600],
    ["P1DT1H", 90000],
    ["P0D", 0],
    ["nonsense", 0],
  ])("%s is %i seconds", (iso, seconds) => {
    expect(parseDuration(iso)).toBe(seconds);
  });
});

describe("formatDuration", () => {
  it.each([
    [5, "0:05"],
    [185, "3:05"],
    [600, "10:00"],
    [3723, "1:02:03"],
  ])("%i seconds is %s", (seconds, text) => {
    expect(formatDuration(seconds)).toBe(text);
  });
});

describe("decodeEntities", () => {
  it("decodes named, decimal and hex entities and leaves unknown ones", () => {
    expect(decodeEntities("&quot;Fran&quot; &lt;3 &#39;21&#x27; &nbsp;")).toBe(
      "\"Fran\" <3 '21' &nbsp;",
    );
  });
});

describe("video cache", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "video-cache-"));
    vi.stubEnv("WOD_CACHE", "on");
    vi.stubEnv("WOD_CACHE_DIR", dir);
  });
  afterEach(async () => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    await rm(dir, { recursive: true, force: true });
  });

  it("finds videos again under any spelling of the movement", async () => {
    const videos = [
      { title: "Pull-ups", url: "https://www.youtube.com/watch?v=a", duration: "1:00" },
    ];
    await cacheVideos("Pull-ups", videos);
    await expect(getCachedVideos("pull up")).resolves.toEqual(videos);
    await expect(getCachedVideos("Push-up")).resolves.toBeNull();
  });

  it("keeps movement and workout videos apart", async () => {
    const videos = [{ title: "Fran", url: "https://www.youtube.com/watch?v=f" }];
    await cacheVideos("Fran", videos, "workout");
    await expect(getCachedVideos("Fran", "workout")).resolves.toEqual(videos);
    await expect(getCachedVideos("Fran")).resolves.toBeNull();
  });

  it("caches an empty result, so it isn't searched again", async () => {
    await cacheVideos("Nonsense", []);
    await expect(getCachedVideos("Nonsense")).resolves.toEqual([]);
  });

  it("keeps videos for a month, then searches again", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-01T12:00:00Z"));
    const videos = [{ title: "Row", url: "https://www.youtube.com/watch?v=r" }];
    await cacheVideos("Row", videos);

    vi.setSystemTime(Date.now() + VIDEOS_MAX_AGE_MS);
    await expect(getCachedVideos("Row")).resolves.toEqual(videos);

    vi.setSystemTime(Date.now() + 1);
    await expect(getCachedVideos("Row")).resolves.toBeNull();
  });

  it("refreshes the month when videos are cached again", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-01T12:00:00Z"));
    await cacheVideos("Row", []);
    vi.setSystemTime(Date.now() + VIDEOS_MAX_AGE_MS + 1);
    await cacheVideos("Row", [{ title: "New", url: "https://www.youtube.com/watch?v=n" }]);
    await expect(getCachedVideos("Row")).resolves.toHaveLength(1);
  });
});
