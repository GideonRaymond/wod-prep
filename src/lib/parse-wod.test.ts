import { beforeEach, describe, expect, it, vi } from "vitest";
import { fran } from "@/test/fixtures";

const { mockParse } = vi.hoisted(() => ({ mockParse: vi.fn() }));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    beta = { messages: { parse: mockParse } };
  },
}));

import { parseWod, WodParseError } from "./parse-wod";

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
