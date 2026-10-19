import { beforeEach, describe, expect, it, vi } from "vitest";
import { PartDetailsSchema, type PartOutline, type WorkoutPart } from "@/schemas/wod";
import { franPart, strengthAndMetcon } from "@/test/fixtures";

const { mockParse } = vi.hoisted(() => ({ mockParse: vi.fn() }));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    beta = { messages: { parse: mockParse } };
  },
}));

import { parseWod, readOutline, readPartDetails, WodParseError } from "./parseWod";

const ok = (parsed_output: unknown) => ({ stop_reason: "end_turn", parsed_output });

const outlineOf = (part: WorkoutPart, kind: PartOutline["kind"] = "part"): PartOutline => ({
  label: part.label,
  title: part.title,
  named: part.named,
  sourceText: part.sourceText,
  board: part.board,
  kind,
});

const detailsOf = (part: WorkoutPart) => PartDetailsSchema.parse(part);

/** Answers the outline call with `outline`, and each part's call with the details of `parts`. */
function answer(outline: PartOutline[], parts: WorkoutPart[]) {
  mockParse.mockImplementation(
    async (params: { model: string; messages: { content: string }[] }) => {
      if (params.model === "claude-haiku-5-5") return ok({ parts: outline });
      const { part } = JSON.parse(params.messages[0].content);
      const match = parts.find((p) => p.sourceText === part.lines) ?? parts[0];
      return ok(detailsOf(match));
    },
  );
}

describe("readOutline", () => {
  beforeEach(() => {
    mockParse.mockReset();
  });

  it("reads the structure quickly with the fast model", async () => {
    const outline = [outlineOf(franPart)];
    mockParse.mockResolvedValue(ok({ parts: outline }));
    await expect(readOutline("Fran")).resolves.toEqual(outline);

    const params = mockParse.mock.calls[0][0];
    expect(params.model).toBe("claude-haiku-5-5");
    expect(params.messages).toEqual([{ role: "user", content: "Fran" }]);
    expect(params.system).toMatch(/Return each part separately/);
    expect(params.system).toMatch(/Never use the label \("Part A"\) as the title/);
  });

  it("labels warm-ups and cool-downs so the class page can place them", async () => {
    mockParse.mockResolvedValue(
      ok({
        parts: [
          { ...outlineOf(franPart, "warmup"), label: "Prep", title: "Easy Row" },
          { ...outlineOf(franPart), label: "A" },
          { ...outlineOf(franPart, "cooldown"), label: null, title: "Stretch" },
        ],
      }),
    );
    const parts = await readOutline("Prep: row\nA) Fran\nStretch");
    expect(parts.map((p) => p.label)).toEqual(["Warm-up", "A", "Cool-down"]);
  });

  it("letters parts the model left unlabelled when another part has a label", async () => {
    mockParse.mockResolvedValue(
      ok({
        parts: [
          { ...outlineOf(franPart), label: null, title: "Nancy" },
          { ...outlineOf(franPart), label: "B", title: "Murph" },
        ],
      }),
    );
    const parts = await readOutline("Nancy\n\nthen part b\n\nmurph");
    expect(parts.map((p) => [p.label, p.title])).toEqual([
      ["A", "Nancy"],
      ["B", "Murph"],
    ]);
  });
});

describe("readPartDetails", () => {
  beforeEach(() => {
    mockParse.mockReset();
  });

  it("reads one part with the whole workout for context", async () => {
    mockParse.mockResolvedValue(ok(detailsOf(franPart)));
    await expect(readPartDetails("A) Squats\nB) Fran", outlineOf(franPart))).resolves.toEqual(
      detailsOf(franPart),
    );

    const params = mockParse.mock.calls[0][0];
    expect(params.model).toBe("claude-opus-5-5");
    expect(JSON.parse(params.messages[0].content)).toEqual({
      workout: "A) Squats\nB) Fran",
      part: { label: franPart.label, title: "Fran", lines: franPart.sourceText },
    });
    expect(params.system).toMatch(/Rate the intended intensity from 1 to 10/);
    expect(params.system).toMatch(/combine it into one entry/);
  });

  it("combines movements the model listed more than once", async () => {
    const run = {
      name: "Run",
      originalText: "1 mile Run",
      reps: "1 mile",
      load: null,
      category: "monostructural" as const,
    };
    mockParse.mockResolvedValue(ok({ ...detailsOf(franPart), movements: [run, run] }));
    const details = await readPartDetails("Murph", outlineOf(franPart));
    expect(details.movements.map((m) => [m.name, m.reps])).toEqual([["Run", "2 miles"]]);
  });
});

describe("parseWod", () => {
  beforeEach(() => {
    mockParse.mockReset();
  });

  it("puts the outline and each part's details together", async () => {
    answer(
      strengthAndMetcon.parts.map((part) => outlineOf(part)),
      strengthAndMetcon.parts,
    );
    await expect(parseWod("A) squats B) Fran")).resolves.toEqual(strengthAndMetcon);
    expect(mockParse).toHaveBeenCalledTimes(1 + strengthAndMetcon.parts.length);
  });

  it("reports the outline first, then each part as it's read", async () => {
    answer(
      strengthAndMetcon.parts.map((part) => outlineOf(part)),
      strengthAndMetcon.parts,
    );
    const calls: string[] = [];
    await parseWod("A) squats B) Fran", {
      onOutline: (parts) => calls.push(`outline ${parts.length}`),
      onPart: (index, part) => calls.push(`part ${index} ${part.title}`),
    });
    expect(calls[0]).toBe("outline 3");
    expect(calls.slice(1).sort()).toEqual([
      "part 0 Heavy Back Squats",
      "part 1 Fran",
      "part 2 Easy Flush",
    ]);
  });

  it("throws WodParseError when the model refuses", async () => {
    mockParse.mockResolvedValue({ stop_reason: "refusal", parsed_output: null });
    await expect(parseWod("Fran")).rejects.toThrow(WodParseError);
  });

  it("throws WodParseError when the output can't be parsed", async () => {
    mockParse.mockResolvedValue({ stop_reason: "end_turn", parsed_output: null });
    await expect(parseWod("hello")).rejects.toThrow(/Couldn't read that as a workout/);
  });

  it("fails when any part can't be read", async () => {
    mockParse
      .mockResolvedValueOnce(ok({ parts: [outlineOf(franPart)] }))
      .mockRejectedValueOnce(new Error("network down"));
    await expect(parseWod("Fran")).rejects.toThrow("network down");
  });
});
