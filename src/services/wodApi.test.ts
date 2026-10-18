import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requestParseWod } from "./wodApi";
import { fran } from "@/test/fixtures";

const fetchMock = vi.fn();

describe("requestParseWod", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the text and returns the parsed WOD", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ wod: fran }) });

    await expect(requestParseWod("Fran")).resolves.toEqual(fran);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/parse");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ text: "Fran" });
  });

  it("throws the API's error message", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: "Too long." }) });
    await expect(requestParseWod("x")).rejects.toThrow("Too long.");
  });

  it("throws a generic message when the API gives none", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });
    await expect(requestParseWod("x")).rejects.toThrow("Something went wrong.");
  });
});
