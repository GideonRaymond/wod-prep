import { describe, expect, it } from "vitest";
import { waitingReferences } from "./waitingReferences";
import { strengthAndMetcon } from "@/test/fixtures";
import type { WodState } from "@/types/wod";
import { toWodState } from "@/utils/toWodState";

const v = (name: string) => ({ title: name, url: `https://example.com/${name}`, duration: "1:00" });
const base = toWodState(strengthAndMetcon);

/** The workout with videos for some movements and named parts, and articles for some parts. */
function withFound({
  movementVideos = {},
  partVideos = {},
  articles = {},
}: {
  movementVideos?: Record<string, string[]>;
  partVideos?: Record<string, string[]>;
  articles?: Record<string, string[]>;
}): WodState {
  return {
    parts: base.parts.map((part) => ({
      ...part,
      ...(partVideos[part.title] && { videos: partVideos[part.title].map(v) }),
      ...(articles[part.title] && {
        articles: articles[part.title].map((t) => ({ title: t, url: `https://example.com/${t}` })),
      }),
      movements: part.movements.map((m) => ({
        ...m,
        ...(movementVideos[m.name] && { videos: movementVideos[m.name].map(v) }),
      })),
    })),
  };
}

describe("waitingReferences", () => {
  it("is empty until something is found", () => {
    expect(waitingReferences(base)).toEqual([]);
  });

  it("puts the named workout's video first, then each movement's first video, then articles", () => {
    const wod = withFound({
      movementVideos: { "Back Squat": ["squat-1", "squat-2"], Thruster: ["thruster-1"] },
      partVideos: { Fran: ["fran-1", "fran-2"] },
      articles: { Fran: ["pacing"] },
    });
    expect(waitingReferences(wod).map((r) => r.title)).toEqual(["fran-1", "squat-1", "thruster-1"]);
    expect(waitingReferences(wod, 10).map((r) => r.title)).toEqual([
      "fran-1",
      "squat-1",
      "thruster-1",
      "pacing",
    ]);
  });

  it("describes each one", () => {
    const wod = withFound({ partVideos: { Fran: ["fran-1"] }, articles: { Fran: ["pacing"] } });
    expect(waitingReferences(wod)).toEqual([
      {
        kind: "video",
        title: "fran-1",
        url: "https://example.com/fran-1",
        meta: ["Video", "1:00", "Fran"],
      },
      { kind: "article", title: "pacing", url: "https://example.com/pacing", meta: ["Article"] },
    ]);
  });

  it("shows a link once, even when two movements share it", () => {
    const wod = withFound({ movementVideos: { Thruster: ["same"], "Pull-up": ["same"] } });
    expect(waitingReferences(wod)).toHaveLength(1);
  });
});
