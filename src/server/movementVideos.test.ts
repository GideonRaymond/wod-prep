import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { mockRank } = vi.hoisted(() => ({ mockRank: vi.fn() }));
vi.mock("./rankVideos", () => ({ rankVideos: mockRank }));

import {
  cacheVideos,
  decodeEntities,
  findCuratedVideo,
  findVideos,
  formatDuration,
  getCachedVideos,
  parseDuration,
  searchVideoCandidates,
  VIDEOS_MAX_AGE_MS,
  YouTubeError,
} from "./movementVideos";
import { CURATED_POINTS_OF_PERFORMANCE } from "@/data/pointsOfPerformance";
import { CURATED_VIDEOS } from "@/data/movementVideos";

const fetchMock = vi.fn();

type Result = {
  id: string;
  title: string;
  channel?: string;
  duration?: string;
  description?: string;
  views?: string;
};

/** Answers the search call, then the video details call, like the YouTube API does. */
function youtubeReturns(results: Result[]) {
  fetchMock
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: results.map(({ id, title, channel = "Some Coach", description = "" }) => ({
          id: { kind: "youtube#video", videoId: id },
          snippet: { title, channelTitle: channel, description },
        })),
      }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: results.map(({ id, duration = "PT2M30S", views = "100" }) => ({
          id,
          contentDetails: { duration },
          statistics: { viewCount: views },
        })),
      }),
    });
}

const requestedUrl = (call: number) => new URL(fetchMock.mock.calls[call][0]);

describe("findVideos without Claude", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    mockRank.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("YOUTUBE_API_KEY", "yt-key");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("searches YouTube for the movement and returns links with durations", async () => {
    youtubeReturns([{ id: "abc", title: "How to Thruster", duration: "PT3M5S" }]);

    await expect(findVideos("Thruster")).resolves.toEqual([
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
    expect(details.searchParams.get("part")).toBe("contentDetails,statistics");
    expect(search.searchParams.get("maxResults")).toBe("15");
    expect(mockRank).not.toHaveBeenCalled();
  });

  it("ranks the CrossFit channel first, then titles naming the movement, then YouTube's order", async () => {
    youtubeReturns([
      { id: "a", title: "Grip tips" },
      { id: "b", title: "Better PULL-UPS fast" },
      { id: "c", title: "Kipping basics", channel: "CrossFit" },
      { id: "d", title: "Pull Up Progressions", channel: "CrossFit" },
      { id: "e", title: "Shoulder warm-up" },
    ]);
    const videos = await findVideos("Pull-up");
    expect(videos.map((v) => v.title)).toEqual([
      "Pull Up Progressions",
      "Kipping basics",
      "Better PULL-UPS fast",
    ]);
  });

  it("searches for a named workout with its own query", async () => {
    youtubeReturns([{ id: "f", title: "Fran Tips" }]);
    await findVideos("Fran", "workout");
    expect(requestedUrl(0).searchParams.get("q")).toBe("Fran CrossFit workout");
  });

  it("returns at most three videos", async () => {
    youtubeReturns(["a", "b", "c", "d", "e"].map((id) => ({ id, title: id })));
    await expect(findVideos("Burpee")).resolves.toHaveLength(3);
  });

  it("skips livestreams and videos over 20 minutes", async () => {
    youtubeReturns([
      { id: "live", title: "Live", duration: "P0D" },
      { id: "long", title: "Full class", duration: "PT45M" },
      { id: "edge", title: "Twenty", duration: "PT20M" },
    ]);
    const videos = await findVideos("Row");
    expect(videos.map((v) => v.title)).toEqual(["Twenty"]);
  });

  it("decodes HTML entities in titles", async () => {
    youtubeReturns([{ id: "a", title: "Don&#39;t Skip &amp; Squat" }]);
    const [video] = await findVideos("Air Squat");
    expect(video.title).toBe("Don't Skip & Squat");
  });

  it("skips the details call when nothing is found", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) });
    await expect(findVideos("Nonsense")).resolves.toEqual([]);
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
    const error = await findVideos("Thruster").catch((e) => e);
    expect(error).toBeInstanceOf(YouTubeError);
    expect(error).toMatchObject({
      status: 403,
      reason: "quotaExceeded",
      message: "Quota exceeded.",
    });
  });

  it("throws a YouTubeError when the error body isn't YouTube's", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503, json: async () => null });
    await expect(findVideos("Thruster")).rejects.toMatchObject({
      status: 503,
      reason: undefined,
    });
  });
});

describe("findVideos with Claude", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    mockRank.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("YOUTUBE_API_KEY", "yt-key");
    vi.stubEnv("ANTHROPIC_API_KEY", "claude-key");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  const results: Result[] = [
    { id: "vlog", title: "I did Murph for 1000 days", views: "900000" },
    {
      id: "story",
      title: "The story behind Murph",
      channel: "CrossFit",
      description: "Lt. Michael Murphy &amp; the workout",
    },
    { id: "pace", title: "Murph pacing strategy", duration: "PT6M12S" },
  ];

  it("sends Claude the candidates and keeps its picks, in its order, with reasons", async () => {
    youtubeReturns(results);
    mockRank.mockResolvedValue([
      { id: "pace", reason: "Pacing and partitioning for Murph." },
      { id: "story", reason: "Background on the hero behind it." },
    ]);

    await expect(findVideos("Murph", "workout")).resolves.toEqual([
      {
        title: "Murph pacing strategy",
        url: "https://www.youtube.com/watch?v=pace",
        duration: "6:12",
        reason: "Pacing and partitioning for Murph.",
      },
      {
        title: "The story behind Murph",
        url: "https://www.youtube.com/watch?v=story",
        duration: "2:30",
        reason: "Background on the hero behind it.",
      },
    ]);

    const [name, kind, candidates] = mockRank.mock.calls[0];
    expect([name, kind]).toEqual(["Murph", "workout"]);
    expect(candidates).toContainEqual({
      id: "story",
      title: "The story behind Murph",
      channel: "CrossFit",
      description: "Lt. Michael Murphy & the workout",
      seconds: 150,
      views: 100,
    });
    expect(candidates).toHaveLength(3);
  });

  it("drops picks that aren't candidates or are repeated, and keeps at most three", async () => {
    youtubeReturns([...results, { id: "extra", title: "Extra" }]);
    mockRank.mockResolvedValue([
      { id: "made-up", reason: "x" },
      { id: "pace", reason: "a" },
      { id: "pace", reason: "again" },
      { id: "story", reason: "b" },
      { id: "vlog", reason: "c" },
      { id: "extra", reason: "d" },
    ]);
    const videos = await findVideos("Murph", "workout");
    expect(videos.map((v) => v.reason)).toEqual(["a", "b", "c"]);
  });

  it("returns no videos when Claude finds none useful", async () => {
    youtubeReturns(results);
    mockRank.mockResolvedValue([]);
    await expect(findVideos("Murph", "workout")).resolves.toEqual([]);
  });

  it("falls back to the simple ranking when Claude fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    youtubeReturns(results);
    mockRank.mockRejectedValue(new Error("overloaded"));
    const videos = await findVideos("Murph", "workout");
    expect(videos.map((v) => v.title)).toEqual([
      "The story behind Murph",
      "I did Murph for 1000 days",
      "Murph pacing strategy",
    ]);
    expect(videos[0].reason).toBeUndefined();
  });

  it("doesn't call Claude when YouTube finds nothing", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) });
    await expect(findVideos("Nonsense")).resolves.toEqual([]);
    expect(mockRank).not.toHaveBeenCalled();
  });
});

describe("searchVideoCandidates", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("YOUTUBE_API_KEY", "yt-key");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("keeps view counts when YouTube has them", async () => {
    youtubeReturns([{ id: "a", title: "A", views: "12345" }]);
    const [candidate] = await searchVideoCandidates("Row");
    expect(candidate.views).toBe(12345);
  });
});

describe("findCuratedVideo", () => {
  it.each(["Thruster", "thrusters", "T2B", "toes to bar", "Clean", "Running"])(
    "has a hand-picked video for %s",
    (name) => {
      expect(findCuratedVideo(name)?.url).toMatch(
        /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/,
      );
    },
  );

  it("has none for other movements", () => {
    expect(findCuratedVideo("Ring Muscle-up")).toBeNull();
  });

  it("covers every movement with curated points of performance", () => {
    const withVideo = new Set(CURATED_VIDEOS.flatMap((entry) => entry.names));
    for (const { names } of CURATED_POINTS_OF_PERFORMANCE) {
      expect(
        names.every((name) => withVideo.has(name)),
        names.join(", "),
      ).toBe(true);
    }
  });

  it("uses each video and name once, with a title and duration", () => {
    const urls = CURATED_VIDEOS.map((entry) => entry.video.url);
    const names = CURATED_VIDEOS.flatMap((entry) => entry.names);
    expect(new Set(urls).size).toBe(urls.length);
    expect(new Set(names).size).toBe(names.length);
    for (const { video } of CURATED_VIDEOS) {
      expect(video.title).not.toBe("");
      expect(video.duration).toMatch(/^\d+:\d{2}$/);
    }
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
