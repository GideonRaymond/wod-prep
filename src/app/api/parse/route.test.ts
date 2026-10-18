import Anthropic from "@anthropic-ai/sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fran } from "@/test/fixtures";
import { MAX_WOD_LENGTH } from "@/constants/wod";

const { mockParseWod } = vi.hoisted(() => ({ mockParseWod: vi.fn() }));

vi.mock("@/server/parseWod", () => ({
  parseWod: mockParseWod,
  WodParseError: class WodParseError extends Error {},
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

describe("POST /api/parse", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    mockParseWod.mockReset();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the parsed workout", async () => {
    mockParseWod.mockResolvedValue(fran);
    const res = await post({ text: "  Fran  " });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ wod: fran });
    expect(mockParseWod).toHaveBeenCalledWith("Fran");
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

  it("returns 422 with the message for WodParseError", async () => {
    mockParseWod.mockRejectedValue(new WodParseError("Couldn't read that."));
    const res = await post({ text: "hello" });

    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: "Couldn't read that." });
  });

  it("explains an invalid API key", async () => {
    mockParseWod.mockRejectedValue(
      new Anthropic.AuthenticationError(401, undefined, "bad key", new Headers()),
    );
    const res = await post({ text: "Fran" });

    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/invalid ANTHROPIC_API_KEY/);
  });

  it("returns 429 when rate limited", async () => {
    mockParseWod.mockRejectedValue(
      new Anthropic.RateLimitError(429, undefined, "slow down", new Headers()),
    );
    const res = await post({ text: "Fran" });
    expect(res.status).toBe(429);
  });

  it("returns a generic 500 for unexpected errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockParseWod.mockRejectedValue(new Error("boom"));
    const res = await post({ text: "Fran" });

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Something went wrong parsing the workout.");
  });
});
