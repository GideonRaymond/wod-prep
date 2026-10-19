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

import { boardCacheKey, cacheBoards, getCachedBoards, redrawBoards } from "./redrawBoard";
import { UnusableResultError } from "./apiErrors";
import type { BoardRequest } from "@/schemas/board";

const request: BoardRequest = {
  parts: [
    {
      board: ["Fran", "21-15-9 for time", "Thrusters 95/65 lb", "Pull-ups"],
      label: null,
      title: "Fran",
      format: "for_time",
      rounds: "15-12-9",
      duration: null,
      notes: null,
      movements: [{ name: "Thruster", reps: "15-12-9", load: "75/55 lb" }],
    },
  ],
};
const redrawn = ["Fran", "15-12-9 for time", "Thrusters 75/55 lb"];
const answer = (parsed_output: unknown, stop_reason = "end_turn") => ({
  stop_reason,
  parsed_output,
});

describe("redrawBoards", () => {
  beforeEach(() => {
    mockParse.mockReset();
  });

  it("asks the fast model to redraw each board from the old one and the edited part", async () => {
    mockParse.mockResolvedValue(answer({ parts: [{ board: redrawn }] }));
    await expect(redrawBoards(request)).resolves.toEqual([redrawn]);

    const params = mockParse.mock.calls[0][0];
    expect(params.model).toBe("claude-haiku-5-5");
    expect(params.system).toContain("change only the lines that are now wrong");
    expect(JSON.parse(params.messages[0].content)).toEqual(request);
  });

  it.each([
    ["a refusal", answer(null, "refusal")],
    ["no output", answer(null)],
    ["the wrong number of boards", answer({ parts: [] })],
    ["an empty board", answer({ parts: [{ board: [] }] })],
  ])("fails clearly on %s", async (_, response) => {
    mockParse.mockResolvedValue(response);
    await expect(redrawBoards(request)).rejects.toBeInstanceOf(UnusableResultError);
  });
});

describe("board cache", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "boards-"));
    vi.stubEnv("WOD_CACHE", "on");
    vi.stubEnv("WOD_CACHE_DIR", dir);
  });
  afterEach(async () => {
    vi.unstubAllEnvs();
    await rm(dir, { recursive: true, force: true });
  });

  it("returns boards stored for the same request", async () => {
    expect(await getCachedBoards(request)).toBeNull();
    await cacheBoards(request, [redrawn]);
    await expect(getCachedBoards(request)).resolves.toEqual([redrawn]);
  });

  it("keys on the edits, not on spacing or case", () => {
    const shouty = { parts: [{ ...request.parts[0], title: "FRAN " }] };
    expect(boardCacheKey(shouty)).toBe(boardCacheKey(request));
    const heavier = { parts: [{ ...request.parts[0], rounds: "21-15-9" }] };
    expect(boardCacheKey(heavier)).not.toBe(boardCacheKey(request));
  });
});
