import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requestMovementVideos } from "./videosApi";

const fetchMock = vi.fn();
const videos = [{ title: "How to Thruster", url: "https://www.youtube.com/watch?v=a" }];

describe("requestMovementVideos", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the movement name and returns the videos", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ videos }) });

    await expect(requestMovementVideos("Thruster")).resolves.toEqual(videos);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/videos");
    expect(JSON.parse(init.body)).toEqual({ name: "Thruster", kind: "movement" });
  });

  it("can ask for videos about a named workout", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ videos }) });
    await requestMovementVideos("Fran", "workout");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ name: "Fran", kind: "workout" });
  });

  it("throws the API's error message", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: "No key." }) });
    await expect(requestMovementVideos("Thruster")).rejects.toThrow("No key.");
  });
});
