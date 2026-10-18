import { beforeEach, describe, expect, it, vi } from "vitest";
import { fran, franPart } from "@/test/fixtures";

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
    const pullUps = { ...franPart.movements[1], reps: "100", originalText: "100 Pull-ups" };
    mockParse.mockResolvedValue({
      stop_reason: "end_turn",
      parsed_output: {
        parts: [
          {
            ...franPart,
            label: "A",
            title: "Pull-up Volume",
            named: false,
            movements: [pullUps, pullUps],
          },
          { ...franPart, label: "B", title: "Murph", movements: [run, pullUps, run] },
        ],
      },
    });

    const wod = await parseWod("Murph");
    expect(wod.parts[0].movements.map((m) => [m.name, m.reps])).toEqual([["Pull-up", "200"]]);
    expect(wod.parts[1].movements.map((m) => [m.name, m.reps])).toEqual([
      ["Run", "2 miles"],
      ["Pull-up", "100"],
    ]);
  });

  it("labels a part the model left unlabelled when another part has a label", async () => {
    mockParse.mockResolvedValue({
      stop_reason: "end_turn",
      parsed_output: {
        parts: [
          { ...franPart, label: null, title: "Nancy" },
          { ...franPart, label: "B", title: "Murph" },
        ],
      },
    });

    const wod = await parseWod("Nancy\n\nthen part b\n\nmurph");
    expect(wod.parts.map((p) => [p.label, p.title])).toEqual([
      ["A", "Nancy"],
      ["B", "Murph"],
    ]);
  });

  it("asks the model to split multi-part WODs and rate intensity", async () => {
    mockParse.mockResolvedValue({ stop_reason: "end_turn", parsed_output: fran });
    await parseWod("A) Back squat 5x5 B) Fran");
    const { system } = mockParse.mock.calls[0][0];
    expect(system).toMatch(/Return each part separately/);
    expect(system).toMatch(/single part with label null/);
    expect(system).toMatch(/Rate the intended intensity from 1 to 10/);
    expect(system).toMatch(/Give every part a title/);
    expect(system).toMatch(/Never use the label \("Part A"\) as the title/);
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
