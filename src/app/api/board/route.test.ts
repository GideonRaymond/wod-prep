import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redrawBoards: vi.fn(),
  getCachedBoards: vi.fn(),
  cacheBoards: vi.fn(),
}));

vi.mock("@/server/redrawBoard", () => mocks);
const { mockLoad } = vi.hoisted(() => ({ mockLoad: vi.fn(async () => {}) }));
vi.mock("@/server/mockLoad", () => ({ mockLoad }));

import { POST } from "./route";
import { UnusableResultError } from "@/server/apiErrors";

const part = {
  board: ["Fran", "21-15-9 for time", "Thrusters 95/65 lb", "Pull-ups"],
  label: null,
  title: "Fran",
  format: "for_time",
  rounds: "15-12-9",
  duration: null,
  notes: null,
  movements: [{ name: "Thruster", reps: "15-12-9", load: "75/55 lb" }],
};
const redrawn = [["Fran", "15-12-9 for time", "Thrusters 75/55 lb"]];

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/board", { method: "POST", body: JSON.stringify(body) }),
  );
}

describe("POST /api/board", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "key");
    mocks.redrawBoards.mockReset();
    mocks.getCachedBoards.mockReset().mockResolvedValue(null);
    mocks.cacheBoards.mockReset().mockResolvedValue(undefined);
    mockLoad.mockClear();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("redraws, caches and returns the boards", async () => {
    mocks.redrawBoards.mockResolvedValue(redrawn);
    const res = await post({ parts: [part] });

    expect(res.status).toBe(200);
    expect(res.headers.get("X-Cache")).toBe("MISS");
    await expect(res.json()).resolves.toEqual({ boards: redrawn });
    expect(mocks.cacheBoards).toHaveBeenCalledWith({ parts: [part] }, redrawn);
    expect(mockLoad).not.toHaveBeenCalled();
  });

  it("returns cached boards without asking Claude, after a mock wait", async () => {
    mocks.getCachedBoards.mockResolvedValue(redrawn);
    const res = await post({ parts: [part] });
    expect(res.headers.get("X-Cache")).toBe("HIT");
    await expect(res.json()).resolves.toEqual({ boards: redrawn });
    expect(mocks.redrawBoards).not.toHaveBeenCalled();
    expect(mockLoad).toHaveBeenCalledWith("board");
  });

  it.each([
    ["no parts", { parts: [] }],
    ["an empty board", { parts: [{ ...part, board: [] }] }],
    ["an unknown format", { parts: [{ ...part, format: "x" }] }],
    ["nothing", null],
  ])("rejects %s", async (_, body) => {
    expect((await post(body)).status).toBe(400);
  });

  it("asks for an API key when it's missing", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect((await post({ parts: [part] })).status).toBe(500);
  });

  it("passes on a clear error and doesn't cache it", async () => {
    mocks.redrawBoards.mockRejectedValue(new UnusableResultError("Couldn't read the board."));
    const res = await post({ parts: [part] });
    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toEqual({ error: "Couldn't read the board." });
    expect(mocks.cacheBoards).not.toHaveBeenCalled();
  });
});
