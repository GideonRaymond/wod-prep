import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requestBoards, toBoardPart } from "./boardApi";
import { fran } from "@/test/fixtures";
import { toWodState } from "@/utils/toWodState";

const fetchMock = vi.fn();
const [part] = toWodState(fran).parts;

describe("toBoardPart", () => {
  it("keeps the old board and what it shows", () => {
    expect(toBoardPart(part)).toEqual({
      board: fran.parts[0].board,
      label: null,
      title: "Fran",
      format: "for_time",
      rounds: "21-15-9",
      duration: null,
      notes: null,
      movements: [
        { name: "Thruster", reps: "21-15-9", load: "95/65 lb" },
        { name: "Pull-up", reps: "21-15-9", load: null },
      ],
    });
  });
});

describe("requestBoards", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the parts and returns their boards", async () => {
    fetchMock.mockResolvedValue(Response.json({ boards: [["Fran"]] }));
    await expect(requestBoards([part])).resolves.toEqual([["Fran"]]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/board");
    expect(JSON.parse(init.body)).toEqual({ parts: [toBoardPart(part)] });
  });

  it("throws the API's error message", async () => {
    fetchMock.mockResolvedValue(Response.json({ error: "No key." }, { status: 500 }));
    await expect(requestBoards([part])).rejects.toThrow("No key.");
  });
});
