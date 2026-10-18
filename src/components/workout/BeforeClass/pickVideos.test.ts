import { describe, expect, it } from "vitest";
import { pickVideos } from "./pickVideos";
import { franPart } from "@/test/fixtures";
import type { ReferenceVideo, WorkoutPartState } from "@/types/wod";
import { toWodState } from "@/utils/toWodState";

const fran = toWodState({ parts: [franPart] }).parts[0];
const videos = (...ids: string[]): ReferenceVideo[] =>
  ids.map((id) => ({ title: id, url: `https://www.youtube.com/watch?v=${id}` }));
const picked = (part: WorkoutPartState) => pickVideos(part).map((v) => `${v.about}: ${v.title}`);

const movement = (name: string, ids: string[]) => ({
  ...fran.movements[0],
  id: name,
  name,
  videos: videos(...ids),
});

describe("pickVideos", () => {
  it("shows one video per movement for Murph, not every video found", () => {
    const murph: WorkoutPartState = {
      ...fran,
      title: "Murph",
      named: false,
      movements: [
        movement("Run", ["run1", "run2", "run3"]),
        movement("Pull-up", ["pull1", "pull2", "pull3"]),
        movement("Push-up", ["push1", "push2", "push3"]),
        movement("Air Squat", ["squat1", "squat2", "squat3"]),
      ],
    };
    expect(picked(murph)).toEqual([
      "Run: run1",
      "Pull-up: pull1",
      "Push-up: push1",
      "Air Squat: squat1",
    ]);
  });

  it("adds one video about a named workout first", () => {
    const part = {
      ...fran,
      videos: videos("fran1", "fran2"),
      movements: [movement("Thruster", ["t1", "t2"]), movement("Pull-up", ["p1", "p2"])],
    };
    expect(picked(part)).toEqual(["Fran: fran1", "Thruster: t1", "Pull-up: p1"]);
  });

  it("ignores workout videos on a part that isn't named", () => {
    const part = {
      ...fran,
      named: false,
      videos: videos("fran1"),
      movements: [movement("Thruster", ["t1"]), movement("Pull-up", ["p1"])],
    };
    expect(picked(part)).toEqual(["Thruster: t1", "Pull-up: p1"]);
  });

  it("shows two videos when the part has a single movement", () => {
    const part = { ...fran, named: false, movements: [movement("Run", ["run1", "run2", "run3"])] };
    expect(picked(part)).toEqual(["Run: run1", "Run: run2"]);
  });

  it("never repeats a video, falling back to the movement's next one", () => {
    const part = {
      ...fran,
      videos: videos("shared"),
      movements: [movement("Thruster", ["shared", "t2"]), movement("Pull-up", ["t2", "p2"])],
    };
    expect(picked(part)).toEqual(["Fran: shared", "Thruster: t2", "Pull-up: p2"]);
  });

  it("skips movements without videos yet", () => {
    expect(
      picked({ ...fran, movements: [fran.movements[0], movement("Pull-up", ["p1"])] }),
    ).toEqual(["Pull-up: p1"]);
  });
});
