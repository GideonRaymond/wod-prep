import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it, vi } from "vitest";
import { claudeErrorResponse, missingApiKeyResponse, UnusableResultError } from "./apiErrors";

describe("claudeErrorResponse", () => {
  it.each([
    [new UnusableResultError("Not a workout."), 422, "Not a workout."],
    [
      new Anthropic.AuthenticationError(401, undefined, "bad", new Headers()),
      500,
      "Missing or invalid ANTHROPIC_API_KEY.",
    ],
    [
      new Anthropic.RateLimitError(429, undefined, "slow", new Headers()),
      429,
      "Rate limited. Try again in a moment.",
    ],
  ])("maps %s to %i", async (err, status, error) => {
    const res = claudeErrorResponse(err, "Fallback");
    expect(res.status).toBe(status);
    expect(await res.json()).toEqual({ error });
  });

  it("logs unexpected errors and uses the fallback message", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = claudeErrorResponse(new Error("boom"), "Fallback");
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Fallback" });
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});

describe("missingApiKeyResponse", () => {
  it("explains how to set the key", async () => {
    const res = missingApiKeyResponse();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/ANTHROPIC_API_KEY/);
  });
});
