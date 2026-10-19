import Anthropic from "@anthropic-ai/sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ParseProgress } from "@/server/parseWod";
import { fran, strengthAndMetcon } from "@/test/fixtures";
import { outlineOf, parseEvents } from "@/test/parseStream";
import type { ParseEvent } from "@/types/parse";
import { MAX_WOD_LENGTH } from "@/constants/wod";

const { mockParseWod, mockGetCachedWod, mockCacheWod } = vi.hoisted(() => ({
  mockParseWod: vi.fn(),
  mockGetCachedWod: vi.fn(),
  mockCacheWod: vi.fn(),
}));

vi.mock("@/server/parseWod", async () => {
  const { UnusableResultError } = await import("@/server/apiErrors");
  return { parseWod: mockParseWod, WodParseError: class extends UnusableResultError {} };
});

vi.mock("@/server/wodCache", () => ({
  getCachedWod: mockGetCachedWod,
  cacheWod: mockCacheWod,
}));

import { POST } from "./route";
import { WodParseError } from "@/server/parseWod";

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/parse", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

/** Every event in a streamed response. */
async function events(res: Response): Promise<ParseEvent[]> {
  const text = await res.text();
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

describe("POST /api/parse", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    mockParseWod.mockReset();
    mockGetCachedWod.mockReset().mockResolvedValue(null);
    mockCacheWod.mockReset().mockResolvedValue(undefined);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("streams the outline, each part, then the workout", async () => {
    mockParseWod.mockImplementation(async (_text: string, progress: ParseProgress) => {
      progress.onOutline?.(outlineOf(fran));
      progress.onPart?.(0, fran.parts[0]);
      return fran;
    });
    const res = await post({ text: "  Fran  " });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toMatch(/application\/x-ndjson/);
    expect(await events(res)).toEqual(parseEvents(fran));
    expect(mockParseWod).toHaveBeenCalledWith("Fran", expect.any(Object));
  });

  it("parses and caches the workout on a cache miss", async () => {
    mockParseWod.mockResolvedValue(fran);
    const res = await post({ text: "Fran" });
    await events(res);

    expect(res.headers.get("X-Cache")).toBe("MISS");
    expect(mockGetCachedWod).toHaveBeenCalledWith("Fran");
    expect(mockCacheWod).toHaveBeenCalledWith("Fran", fran);
  });

  it("streams a cached workout all at once without calling Claude", async () => {
    mockGetCachedWod.mockResolvedValue(strengthAndMetcon);
    const res = await post({ text: "Fran" });

    expect(res.status).toBe(200);
    expect(res.headers.get("X-Cache")).toBe("HIT");
    expect(await events(res)).toEqual(parseEvents(strengthAndMetcon));
    expect(mockParseWod).not.toHaveBeenCalled();
    expect(mockCacheWod).not.toHaveBeenCalled();
  });

  it("serves cached workouts even without an API key", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    mockGetCachedWod.mockResolvedValue(fran);
    const res = await post({ text: "Fran" });
    expect(res.status).toBe(200);
  });

  it("doesn't cache failed parses", async () => {
    mockParseWod.mockRejectedValue(new WodParseError("Couldn't read that."));
    await events(await post({ text: "hello" }));
    expect(mockCacheWod).not.toHaveBeenCalled();
  });

  it("errors when the API key is missing", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const res = await post({ text: "Fran" });

    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/ANTHROPIC_API_KEY/);
    expect(mockParseWod).not.toHaveBeenCalled();
  });

  it.each([
    ["empty text", { text: "   " }],
    ["missing text", {}],
    ["non-string text", { text: 42 }],
    ["invalid JSON", "{not json"],
  ])("rejects %s", async (_label, body) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Paste a workout first.");
  });

  it("accepts text at the max length", async () => {
    mockParseWod.mockResolvedValue(fran);
    const res = await post({ text: "x".repeat(MAX_WOD_LENGTH) });
    expect(res.status).toBe(200);
  });

  it("rejects text that is too long", async () => {
    const res = await post({ text: "x".repeat(MAX_WOD_LENGTH + 1) });
    expect(res.status).toBe(400);
    expect(mockParseWod).not.toHaveBeenCalled();
  });

  it.each([
    [
      "the message of a WodParseError",
      new WodParseError("Couldn't read that."),
      "Couldn't read that.",
    ],
    [
      "an invalid API key",
      new Anthropic.AuthenticationError(401, undefined, "bad key", new Headers()),
      "Missing or invalid ANTHROPIC_API_KEY.",
    ],
    [
      "a rate limit",
      new Anthropic.RateLimitError(429, undefined, "slow down", new Headers()),
      "Rate limited. Try again in a moment.",
    ],
    [
      "a generic message for anything else",
      new Error("boom"),
      "Something went wrong parsing the workout.",
    ],
  ])("streams %s as an error", async (_label, err, message) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockParseWod.mockRejectedValue(err);
    const res = await post({ text: "Fran" });
    expect(await events(res)).toEqual([{ type: "error", error: message }]);
  });
});
