import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockParse } = vi.hoisted(() => ({ mockParse: vi.fn() }));
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    beta = { messages: { parse: mockParse } };
  },
}));

import {
  ARTICLES_MAX_AGE_MS,
  articlesCacheKey,
  cacheArticles,
  findArticles,
  getCachedArticles,
} from "./articles";
import { UnusableResultError } from "./apiErrors";
import type { ArticleRequest } from "@/schemas/articles";

const fran: ArticleRequest = {
  title: "Fran",
  named: true,
  format: "for_time",
  rounds: "21-15-9",
  duration: null,
  movements: [
    { name: "Thruster", reps: "21-15-9", load: "95/65 lb" },
    { name: "Pull-up", reps: "21-15-9", load: null },
  ],
  stimulus: "Short and all-out.",
  intensity: 9,
};

const FREE_PDF = "https://library.crossfit.com/free/pdf/31_05_fooling_with_fran.pdf";

/** A search result block listing the given URLs, as the web search tool returns them. */
const searchResult = (...urls: string[]) => ({
  type: "web_search_tool_result",
  tool_use_id: "s1",
  content: urls.map((url) => ({ type: "web_search_result", url, title: url })),
});

const pick = (url: string, extra: object = {}) => ({
  title: "Fooling Around with Fran",
  url,
  source: "CrossFit Journal",
  minutes: 11,
  angle: "tie-in",
  reason: "Why thrusters and pull-ups.",
  members: false,
  ...extra,
});

function answer(articles: object[], found: object[] = [searchResult(FREE_PDF)]) {
  return {
    stop_reason: "end_turn",
    content: [...found, { type: "text", text: JSON.stringify({ articles }) }],
    parsed_output: { articles },
  };
}

describe("findArticles", () => {
  beforeEach(() => {
    mockParse.mockReset();
  });

  it("returns Claude's picks, dropping empty reading times and members flags", async () => {
    mockParse.mockResolvedValue(answer([pick(FREE_PDF, { minutes: null })]));
    await expect(findArticles(fran)).resolves.toEqual([
      {
        title: "Fooling Around with Fran",
        url: FREE_PDF,
        source: "CrossFit Journal",
        angle: "tie-in",
        reason: "Why thrusters and pull-ups.",
      },
    ]);
  });

  it("searches the web with the workout part, preferring CrossFit's own writing", async () => {
    mockParse.mockResolvedValue(answer([]));
    await findArticles(fran);

    const params = mockParse.mock.calls[0][0];
    expect(params.model).toBe("claude-opus-5-5");
    expect(params.output_config.format).toBeDefined();
    expect(params.tools.map((t: { type: string }) => t.type)).toEqual([
      "web_search_20260209",
      "web_fetch_20260209",
    ]);
    expect(params.system).toContain("library.crossfit.com/free/pdf/");
    expect(params.system).toContain("The stimulus and intensity (1 to 10) are the coach's");
    expect(JSON.parse(params.messages[0].content)).toEqual(fran);
  });

  it("drops links that didn't come back from a search or fetch", async () => {
    mockParse.mockResolvedValue(answer([pick("https://made-up.example.com/fran"), pick(FREE_PDF)]));
    const articles = await findArticles(fran);
    expect(articles.map((a) => a.url)).toEqual([FREE_PDF]);
  });

  it("accepts links found through filtering code or a fetch, ignoring a trailing slash", async () => {
    const url = "https://www.crossfit.com/essentials/crossfit-art-of-pacing";
    mockParse.mockResolvedValue(
      answer(
        [pick(`${url}/`)],
        [{ type: "code_execution_tool_result", content: { stdout: `1. Pacing ${url}\n` } }],
      ),
    );
    await expect(findArticles(fran)).resolves.toHaveLength(1);
  });

  it("keeps members-only Journal articles, marked", async () => {
    const url = "https://journal.crossfit.com/2009/12/the-story-of-fran.tpl";
    mockParse.mockResolvedValue(answer([pick(url, { members: true })], [searchResult(url)]));
    const [article] = await findArticles(fran);
    expect(article.members).toBe(true);
  });

  it("drops duplicates and keeps at most three", async () => {
    const urls = [1, 2, 3, 4].map((n) => `https://example.com/${n}`);
    mockParse.mockResolvedValue(
      answer(
        [pick(urls[0]), pick(urls[0]), ...urls.slice(1).map((u) => pick(u))],
        [searchResult(...urls)],
      ),
    );
    const articles = await findArticles(fran);
    expect(articles.map((a) => a.url)).toEqual(urls.slice(0, 3));
  });

  it("resumes a paused search and checks links from every turn", async () => {
    const paused = { stop_reason: "pause_turn", content: [searchResult(FREE_PDF)] };
    mockParse.mockResolvedValueOnce(paused).mockResolvedValueOnce(answer([pick(FREE_PDF)], []));

    await expect(findArticles(fran)).resolves.toHaveLength(1);
    expect(mockParse).toHaveBeenCalledTimes(2);
    expect(mockParse.mock.calls[1][0].messages).toEqual([
      expect.objectContaining({ role: "user" }),
      { role: "assistant", content: paused.content },
    ]);
  });

  it("gives up on a search that keeps pausing", async () => {
    mockParse.mockResolvedValue({ stop_reason: "pause_turn", content: [], parsed_output: null });
    await expect(findArticles(fran)).rejects.toBeInstanceOf(UnusableResultError);
    expect(mockParse).toHaveBeenCalledTimes(4);
  });

  it("throws a clear error when Claude declines", async () => {
    mockParse.mockResolvedValue({ stop_reason: "refusal", content: [], parsed_output: null });
    await expect(findArticles(fran)).rejects.toThrow("declined");
  });
});

describe("articlesCacheKey", () => {
  const amrap: ArticleRequest = {
    ...fran,
    title: "Quick Couplet",
    named: false,
    format: "amrap",
    rounds: null,
    duration: "12 min",
  };

  it("finds a named workout by its name alone", () => {
    expect(articlesCacheKey({ ...fran, rounds: "5 rounds", stimulus: "Other" })).toBe(
      articlesCacheKey(fran),
    );
  });

  it("matches other parts on format, scheme and movements, not the made-up title", () => {
    expect(articlesCacheKey({ ...amrap, title: "Fast Pair", stimulus: "Other" })).toBe(
      articlesCacheKey(amrap),
    );
    expect(articlesCacheKey({ ...amrap, duration: "20 min" })).not.toBe(articlesCacheKey(amrap));
    expect(articlesCacheKey({ ...amrap, movements: amrap.movements.slice(1) })).not.toBe(
      articlesCacheKey(amrap),
    );
  });

  it("needs the same intensity too, which steers the pick", () => {
    expect(articlesCacheKey({ ...fran, intensity: 3 })).not.toBe(articlesCacheKey(fran));
    expect(articlesCacheKey({ ...amrap, intensity: 3 })).not.toBe(articlesCacheKey(amrap));
  });
});

describe("articles cache", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "articles-cache-"));
    vi.stubEnv("WOD_CACHE", "on");
    vi.stubEnv("WOD_CACHE_DIR", dir);
  });
  afterEach(async () => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    await rm(dir, { recursive: true, force: true });
  });

  it("caches an empty result, so it isn't searched again", async () => {
    await cacheArticles(fran, []);
    await expect(getCachedArticles(fran)).resolves.toEqual([]);
  });

  it("keeps articles for a month, then searches again", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-01T12:00:00Z"));
    const articles = [{ title: "Fran", url: FREE_PDF }];
    await cacheArticles(fran, articles);

    vi.setSystemTime(Date.now() + ARTICLES_MAX_AGE_MS);
    await expect(getCachedArticles(fran)).resolves.toEqual(articles);

    vi.setSystemTime(Date.now() + 1);
    await expect(getCachedArticles(fran)).resolves.toBeNull();
  });
});
