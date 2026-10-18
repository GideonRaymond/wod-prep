import { describe, expect, it } from "vitest";
import { referenceCounts } from "./referenceCounts";
import { franPart } from "@/test/fixtures";
import { toWodState } from "@/utils/toWodState";

const fran = toWodState({ parts: [franPart] }).parts[0];
const video = { title: "Technique", url: "https://example.com/v" };

describe("referenceCounts", () => {
  it("is empty without reference material", () => {
    expect(referenceCounts(fran)).toBe("");
  });

  it("counts videos across movements and articles, singular and plural", () => {
    const part = {
      ...fran,
      movements: [
        { ...fran.movements[0], videos: [video, video] },
        { ...fran.movements[1], videos: [video] },
      ],
      articles: [{ title: "Pacing", url: "https://example.com/a" }],
    };
    expect(referenceCounts(part)).toBe("3 videos · 1 article");
  });
});
