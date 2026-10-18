import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  searchMovementVideos: vi.fn(),
  getCachedVideos: vi.fn(),
  cacheVideos: vi.fn(),
}));

vi.mock("@/server/movementVideos", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/movementVideos")>()),
  ...mocks,
}));

import { POST } from "./route";
import { YouTubeError } from "@/server/movementVideos";
import { MAX_MOVEMENT_NAME_LENGTH } from "@/constants/wod";

const videos = [{ title: "How to Thruster", url: "https://www.youtube.com/watch?v=a" }];

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/videos", { method: "POST", body: JSON.stringify(body) }),
  );
}

describe("POST /api/videos", () => {
  beforeEach(() => {
    vi.stubEnv("YOUTUBE_API_KEY", "yt-key");
    mocks.searchMovementVideos.mockReset();
    mocks.getCachedVideos.mockReset().mockResolvedValue(null);
    mocks.cacheVideos.mockReset().mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("searches, caches and returns the videos", async () => {
    mocks.searchMovementVideos.mockResolvedValue(videos);
    const res = await post({ name: " Thruster " });

    expect(res.status).toBe(200);
    expect(res.headers.get("X-Cache")).toBe("MISS");
    await expect(res.json()).resolves.toEqual({ videos });
    expect(mocks.searchMovementVideos).toHaveBeenCalledWith("Thruster", "movement");
    expect(mocks.cacheVideos).toHaveBeenCalledWith("Thruster", videos, "movement");
  });

  it("searches and caches videos about a named workout separately", async () => {
    mocks.searchMovementVideos.mockResolvedValue(videos);
    await post({ name: "Fran", kind: "workout" });
    expect(mocks.getCachedVideos).toHaveBeenCalledWith("Fran", "workout");
    expect(mocks.searchMovementVideos).toHaveBeenCalledWith("Fran", "workout");
    expect(mocks.cacheVideos).toHaveBeenCalledWith("Fran", videos, "workout");
  });

  it("rejects an unknown kind", async () => {
    expect((await post({ name: "Fran", kind: "article" })).status).toBe(400);
  });

  it("returns cached videos without searching, even without an API key", async () => {
    vi.stubEnv("YOUTUBE_API_KEY", "");
    mocks.getCachedVideos.mockResolvedValue(videos);
    const res = await post({ name: "Thruster" });

    expect(res.headers.get("X-Cache")).toBe("HIT");
    await expect(res.json()).resolves.toEqual({ videos });
    expect(mocks.searchMovementVideos).not.toHaveBeenCalled();
  });

  it.each([{}, { name: "" }, { name: 5 }])("rejects a missing name: %j", async (body) => {
    expect((await post(body)).status).toBe(400);
  });

  it("rejects a name that's too long", async () => {
    expect((await post({ name: "x".repeat(MAX_MOVEMENT_NAME_LENGTH + 1) })).status).toBe(400);
  });

  it("explains a missing API key", async () => {
    vi.stubEnv("YOUTUBE_API_KEY", "");
    const res = await post({ name: "Thruster" });
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/YOUTUBE_API_KEY/);
  });

  it("explains when the daily quota is used up", async () => {
    mocks.searchMovementVideos.mockRejectedValue(new YouTubeError("Quota", 403, "quotaExceeded"));
    const res = await post({ name: "Thruster" });
    expect(res.status).toBe(429);
    expect((await res.json()).error).toMatch(/daily search limit/);
    expect(mocks.cacheVideos).not.toHaveBeenCalled();
  });

  it("explains a rejected API key", async () => {
    mocks.searchMovementVideos.mockRejectedValue(new YouTubeError("Bad key", 400, "badRequest"));
    const res = await post({ name: "Thruster" });
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/rejected the API key/);
  });

  it("returns a generic error for anything else", async () => {
    mocks.searchMovementVideos.mockRejectedValue(new Error("network down"));
    const res = await post({ name: "Thruster" });
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe("Something went wrong finding videos.");
  });
});
