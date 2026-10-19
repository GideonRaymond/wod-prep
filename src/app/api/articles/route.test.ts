import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findArticles: vi.fn(),
  getCachedArticles: vi.fn(),
  cacheArticles: vi.fn(),
}));

vi.mock("@/server/articles", () => mocks);

import { POST } from "./route";
import { UnusableResultError } from "@/server/apiErrors";

const part = {
  title: "Fran",
  named: true,
  format: "for_time",
  rounds: "21-15-9",
  duration: null,
  movements: [{ name: "Thruster", reps: "21-15-9", load: "95/65 lb" }],
  stimulus: "Short and all-out.",
};
const articles = [{ title: "Fooling Around with Fran", url: "https://library.crossfit.com/a.pdf" }];

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/articles", { method: "POST", body: JSON.stringify(body) }),
  );
}

describe("POST /api/articles", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "key");
    mocks.findArticles.mockReset();
    mocks.getCachedArticles.mockReset().mockResolvedValue(null);
    mocks.cacheArticles.mockReset().mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("searches, caches and returns the articles", async () => {
    mocks.findArticles.mockResolvedValue(articles);
    const res = await post({ part: { ...part, title: " Fran " } });

    expect(res.status).toBe(200);
    expect(res.headers.get("X-Cache")).toBe("MISS");
    await expect(res.json()).resolves.toEqual({ articles });
    expect(mocks.findArticles).toHaveBeenCalledWith(part);
    expect(mocks.cacheArticles).toHaveBeenCalledWith(part, articles);
  });

  it("returns cached articles without searching", async () => {
    mocks.getCachedArticles.mockResolvedValue(articles);
    const res = await post({ part });
    expect(res.headers.get("X-Cache")).toBe("HIT");
    await expect(res.json()).resolves.toEqual({ articles });
    expect(mocks.findArticles).not.toHaveBeenCalled();
  });

  it.each([
    ["no part", {}],
    ["no movements", { part: { ...part, movements: [] } }],
    ["an unknown format", { part: { ...part, format: "chipper" } }],
    ["a very long stimulus", { part: { ...part, stimulus: "x".repeat(1001) } }],
  ])("rejects %s", async (_, body) => {
    expect((await post(body)).status).toBe(400);
    expect(mocks.findArticles).not.toHaveBeenCalled();
  });

  it("asks for an API key when it's missing", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const res = await post({ part });
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Set ANTHROPIC_API_KEY in .env.local." });
  });

  it("passes on a clear error when the result can't be used", async () => {
    mocks.findArticles.mockRejectedValue(new UnusableResultError("Couldn't read the list."));
    const res = await post({ part });
    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toEqual({ error: "Couldn't read the list." });
    expect(mocks.cacheArticles).not.toHaveBeenCalled();
  });

  it("explains other failures without details", async () => {
    mocks.findArticles.mockRejectedValue(new Error("socket hang up"));
    const res = await post({ part });
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: "Something went wrong finding reading for this workout.",
    });
  });
});
