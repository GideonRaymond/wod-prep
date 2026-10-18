import { beforeEach, describe, expect, it, vi } from "vitest";
import { fran } from "@/test/fixtures";

const { mockParse } = vi.hoisted(() => ({ mockParse: vi.fn() }));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    beta = { messages: { parse: mockParse } };
  },
}));

import { parseWod, WodParseError } from "./parseWod";

describe("parseWod", () => {
  beforeEach(() => {
    mockParse.mockReset();
  });

  it("returns the parsed workout", async () => {
    mockParse.mockResolvedValue({ stop_reason: "end_turn", parsed_output: fran });
    await expect(parseWod("Fran")).resolves.toEqual(fran);
  });

  it("sends the WOD text to Claude with structured output", async () => {
    mockParse.mockResolvedValue({ stop_reason: "end_turn", parsed_output: fran });
    await parseWod("21-15-9 thrusters, pull-ups");

    const params = mockParse.mock.calls[0][0];
    expect(params.model).toBe("claude-opus-5-5");
    expect(params.messages).toEqual([{ role: "user", content: "21-15-9 thrusters, pull-ups" }]);
    expect(params.output_config.format).toBeDefined();
    expect(params.fallbacks).toBe("default");
  });

  it("combines movements the model listed more than once", async () => {
    const run = {
      name: "Run",
      originalText: "1 mile Run",
      reps: "1 mile",
      load: null,
      category: "monostructural" as const,
    };
    const pullUps = { ...fran.movements[1], reps: "100", originalText: "100 Pull-ups" };
    mockParse.mockResolvedValue({
      stop_reason: "end_turn",
      parsed_output: { ...fran, title: "Murph", movements: [run, pullUps, run] },
    });

    const wod = await parseWod("Murph");
    expect(wod.movements.map((m) => [m.name, m.reps])).toEqual([
      ["Run", "2 miles"],
      ["Pull-up", "100"],
    ]);
  });

  it("asks the model to combine repeated movements", async () => {
    mockParse.mockResolvedValue({ stop_reason: "end_turn", parsed_output: fran });
    await parseWod("Murph");
    expect(mockParse.mock.calls[0][0].system).toMatch(/combine it into one entry/);
  });

  it("throws WodParseError when the model refuses", async () => {
    mockParse.mockResolvedValue({ stop_reason: "refusal", parsed_output: null });
    await expect(parseWod("Fran")).rejects.toThrow(WodParseError);
  });

  it("throws WodParseError when the output can't be parsed", async () => {
    mockParse.mockResolvedValue({ stop_reason: "end_turn", parsed_output: null });
    await expect(parseWod("hello")).rejects.toThrow(/Couldn't read that as a workout/);
  });

  it("lets API errors bubble up", async () => {
    mockParse.mockRejectedValue(new Error("network down"));
    await expect(parseWod("Fran")).rejects.toThrow("network down");
  });
});
