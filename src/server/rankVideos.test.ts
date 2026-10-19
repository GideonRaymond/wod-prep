import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockParse } = vi.hoisted(() => ({ mockParse: vi.fn() }));
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    beta = { messages: { parse: mockParse } };
  },
}));

import { rankVideos, type VideoCandidate } from "./rankVideos";
import { UnusableResultError } from "./apiErrors";

const candidate: VideoCandidate = {
  id: "abc",
  title: "The Thruster",
  channel: "CrossFit",
  description: "x".repeat(1000),
  seconds: 71,
  views: 2873338,
};

describe("rankVideos", () => {
  beforeEach(() => {
    mockParse.mockReset();
  });

  it("returns Claude's picks", async () => {
    const picks = [{ id: "abc", reason: "Official demo of the thruster." }];
    mockParse.mockResolvedValue({ stop_reason: "end_turn", parsed_output: { picks } });
    await expect(rankVideos("Thruster", "movement", [candidate])).resolves.toEqual(picks);
  });

  it("sends the movement and candidates with shortened descriptions", async () => {
    mockParse.mockResolvedValue({ stop_reason: "end_turn", parsed_output: { picks: [] } });
    await rankVideos("Thruster", "movement", [candidate]);

    const params = mockParse.mock.calls[0][0];
    expect(params.model).toBe("claude-opus-5-5");
    expect(params.output_config.format).toBeDefined();
    const sent = JSON.parse(params.messages[0].content);
    expect(sent.movement).toBe("Thruster");
    expect(sent.candidates[0]).toMatchObject({ id: "abc", channel: "CrossFit", views: 2873338 });
    expect(sent.candidates[0].description).toHaveLength(300);
  });

  it("names a workout as a workout", async () => {
    mockParse.mockResolvedValue({ stop_reason: "end_turn", parsed_output: { picks: [] } });
    await rankVideos("Fran", "workout", [candidate]);
    const sent = JSON.parse(mockParse.mock.calls[0][0].messages[0].content);
    expect(sent.workout).toBe("Fran");
    expect(mockParse.mock.calls[0][0].system).toMatch(/named workout/);
  });

  it("throws UnusableResultError when Claude refuses or the output can't be read", async () => {
    mockParse.mockResolvedValueOnce({ stop_reason: "refusal", parsed_output: null });
    await expect(rankVideos("Thruster", "movement", [candidate])).rejects.toThrow(
      UnusableResultError,
    );
    mockParse.mockResolvedValueOnce({ stop_reason: "end_turn", parsed_output: null });
    await expect(rankVideos("Thruster", "movement", [candidate])).rejects.toThrow(
      UnusableResultError,
    );
  });
});
