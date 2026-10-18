import { describe, expect, it } from "vitest";
import { referenceCounts } from "./referenceCounts";
import { franPart } from "@/test/fixtures";
import { toWodState } from "@/utils/toWodState";

const fran = toWodState({ parts: [franPart] }).parts[0];
const video = (id: string) => ({ title: "Technique", url: `https://example.com/${id}` });

describe("referenceCounts", () => {
  it("is empty without reference material", () => {
    expect(referenceCounts(fran)).toBe("");
  });

  it("counts the videos shown and the articles, singular and plural", () => {
    const part = {
      ...fran,
      videos: [video("fran")],
      movements: [
        { ...fran.movements[0], videos: [video("t1"), video("t2")] },
        { ...fran.movements[1], videos: [video("p1")] },
      ],
      articles: [{ title: "Pacing", url: "https://example.com/a" }],
    };
    expect(referenceCounts(part)).toBe("3 videos · 1 article");
    expect(referenceCounts({ ...part, videos: undefined, articles: [] })).toBe("2 videos");
  });
});
