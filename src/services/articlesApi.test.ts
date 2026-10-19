import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requestArticles, toArticleRequest } from "./articlesApi";
import { franPart } from "@/test/fixtures";
import { toWodState } from "@/utils/toWodState";

const fetchMock = vi.fn();
const part = toWodState({ parts: [franPart] }).parts[0];
const articles = [{ title: "Fooling Around with Fran", url: "https://library.crossfit.com/a.pdf" }];

describe("toArticleRequest", () => {
  it("keeps what the search needs and leaves out ids, videos and source text", () => {
    const request = toArticleRequest({ ...part, videos: [] });
    expect(request).toEqual({
      title: franPart.title,
      named: franPart.named,
      format: franPart.format,
      rounds: franPart.rounds,
      duration: franPart.duration,
      movements: franPart.movements.map(({ name, reps, load }) => ({ name, reps, load })),
      stimulus: franPart.stimulus.description,
    });
  });
});

describe("requestArticles", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the part and returns the articles", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ articles }) });

    await expect(requestArticles(part)).resolves.toEqual(articles);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/articles");
    expect(JSON.parse(init.body)).toEqual({ part: toArticleRequest(part) });
  });

  it("throws the server's error message", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: "Rate limited." }) });
    await expect(requestArticles(part)).rejects.toThrow("Rate limited.");
  });
});
