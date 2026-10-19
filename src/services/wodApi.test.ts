import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requestParseWod } from "./wodApi";
import { fran, strengthAndMetcon } from "@/test/fixtures";
import { parseEvents, streamResponse } from "@/test/parseStream";

const fetchMock = vi.fn();

describe("requestParseWod", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the text and resolves with the parsed WOD", async () => {
    fetchMock.mockResolvedValue(streamResponse(parseEvents(fran)));

    await expect(requestParseWod("Fran")).resolves.toEqual(fran);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/parse");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ text: "Fran" });
  });

  it("reports the outline and each part as they stream in, however the chunks fall", async () => {
    fetchMock.mockResolvedValue(streamResponse(parseEvents(strengthAndMetcon), 7));
    const onOutline = vi.fn();
    const onPart = vi.fn();

    await requestParseWod("A) squats B) Fran", { onOutline, onPart });
    expect(onOutline).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ title: "Fran", kind: "part" })]),
    );
    expect(onPart.mock.calls.map(([index, part]) => [index, part.title])).toEqual([
      [0, "Heavy Back Squats"],
      [1, "Fran"],
      [2, "Easy Flush"],
    ]);
  });

  it("throws a streamed error", async () => {
    fetchMock.mockResolvedValue(
      streamResponse([...parseEvents(fran).slice(0, 1), { type: "error", error: "Rate limited." }]),
    );
    await expect(requestParseWod("Fran")).rejects.toThrow("Rate limited.");
  });

  it("throws when the stream ends before the workout is read", async () => {
    fetchMock.mockResolvedValue(streamResponse(parseEvents(fran).slice(0, 1)));
    await expect(requestParseWod("Fran")).rejects.toThrow(/connection closed/);
  });

  it("throws the API's error message", async () => {
    fetchMock.mockResolvedValue(Response.json({ error: "Too long." }, { status: 400 }));
    await expect(requestParseWod("x")).rejects.toThrow("Too long.");
  });

  it("throws a generic message when the API gives none", async () => {
    fetchMock.mockResolvedValue(new Response("oops", { status: 500 }));
    await expect(requestParseWod("x")).rejects.toThrow("Something went wrong.");
  });
});
