import { describe, expect, it } from "vitest";
import { classChecklist, startTimes, type ClassProgress } from "./classChecklist";
import type { ChecklistItem } from "@/components/shared/Checklist";
import { videoSearchKey } from "@/hooks/useMovementVideos";
import { classPrep, fran, strengthAndMetcon } from "@/test/fixtures";
import { planClass, WHITEBOARD_MINUTES } from "@/utils/classPlan";
import { partKey } from "@/utils/partKey";
import { toWodState } from "@/utils/toWodState";

const wod = toWodState(strengthAndMetcon);

const progress = (overrides: Partial<ClassProgress> = {}): ClassProgress => ({
  wod,
  prep: classPrep,
  prepLoading: false,
  articlesLoading: false,
  videosPending: new Set(),
  ...overrides,
});

const row = (items: ChecklistItem[], id: string) => items.find((item) => item.id === id)!;

describe("classChecklist", () => {
  it("starts from the structure every class has", () => {
    const { items, ready } = classChecklist(
      progress({ prep: null, prepLoading: true, articlesLoading: true }),
    );
    expect(items.map((item) => item.name)).toEqual([
      "Reading your workout",
      "Before class",
      "Warm-up",
      "Workout",
      "Cool-down",
    ]);
    expect(items.map((item) => item.state)).toEqual([
      "done",
      "working",
      "working",
      "working",
      "done",
    ]);
    expect(row(items, "reading").meta).toBe("3 blocks found");
    expect(ready).toBe(false);
  });

  it("adds a Chalkboard step while edited parts are redrawn, and keeps it once they are", () => {
    const lighter = { ...wod.parts[1], rounds: "15-12-9" };
    const edited = { parts: [wod.parts[0], lighter, wod.parts[2]] };
    const working = classChecklist(progress({ wod: edited, boardLoading: true }));
    expect(working.items.map((item) => item.id).slice(0, 3)).toEqual(["reading", "board", "pre"]);
    expect(row(working.items, "board")).toMatchObject({
      name: "Chalkboard",
      state: "working",
      meta: "Redrawing it with your changes",
    });
    expect(working.ready).toBe(false);

    const redrawn = {
      parts: [wod.parts[0], { ...lighter, boardKey: partKey(lighter) }, wod.parts[2]],
    };
    const done = classChecklist(progress({ wod: redrawn }));
    expect(row(done.items, "board")).toMatchObject({
      state: "done",
      meta: "Redrawn with your changes",
    });
    expect(done.ready).toBe(true);
  });

  it("has no Chalkboard step when nothing was redrawn", () => {
    expect(row(classChecklist(progress()).items, "board")).toBeUndefined();
  });

  it("grows the Workout row into the parts, with skills where they're practised", () => {
    const { items } = classChecklist(progress());
    const children = row(items, "workout").children!;
    expect(children.map((c) => [c.marker, c.name])).toEqual([
      ["A", "Heavy Back Squats"],
      ["Skill", "Pull-up"],
      ["B", "Fran"],
    ]);
    expect(children[0].meta).toBe("15 min · Barbell, Squat rack, Plates");
    expect(children[1].meta).toBe("11 min · Pull-up bar, Resistance band");
    expect(row(items, "workout").meta).toBe("2 parts · 1 skill");
  });

  it("keeps a part working until its videos are found", () => {
    const { items } = classChecklist(
      progress({ videosPending: new Set([videoSearchKey("Thruster", "movement")]) }),
    );
    const fran = row(items, "workout").children!.find((c) => c.name === "Fran")!;
    expect(fran).toMatchObject({ state: "working", meta: "Finding videos" });
    expect(row(items, "workout").state).toBe("working");
    expect(row(items, "pre").state).toBe("done");
  });

  it("keeps Before class working until the named workout's own videos are found", () => {
    const { items } = classChecklist(
      progress({ videosPending: new Set([videoSearchKey("Fran", "workout")]) }),
    );
    expect(row(items, "pre")).toMatchObject({ state: "working", meta: "Articles and videos" });
  });

  it("counts the reading once it's found", () => {
    const withReading = {
      parts: wod.parts.map((part, i) =>
        i === 1
          ? {
              ...part,
              articles: [{ title: "Pacing Fran", url: "https://example.com/a" }],
              videos: [{ title: "Fran", url: "https://example.com/v" }],
            }
          : part,
      ),
    };
    expect(row(classChecklist(progress({ wod: withReading })).items, "pre").meta).toBe(
      "1 article · 1 video",
    );
    expect(row(classChecklist(progress()).items, "pre").meta).toBe("Nothing to read this time");
  });

  it("describes the planned warm-up, a programmed one, or none", () => {
    expect(row(classChecklist(progress()).items, "warmup").meta).toBe("10 min · Rower, Barbell");

    const programmed = {
      parts: [
        { ...wod.parts[2], id: "w", label: "Warm-up", minutes: 8, equipment: ["Bike"] },
        ...wod.parts,
      ],
    };
    expect(row(classChecklist(progress({ wod: programmed })).items, "warmup").meta).toBe(
      "8 min · Bike",
    );
    expect(row(classChecklist(progress({ prep: null })).items, "warmup").meta).toBe(
      "Not planned this time",
    );
  });

  it("suggests stretches when no cool-down is programmed", () => {
    const { items } = classChecklist(progress({ wod: toWodState(fran), prep: null }));
    expect(row(items, "cooldown").meta).toBe("3 stretches · if time allows");
  });

  it("times the class once everything else is done", () => {
    const { items, ready } = classChecklist(progress());
    expect(ready).toBe(true);
    expect(items.at(-1)).toMatchObject({
      name: "Timing the class",
      state: "done",
      meta: "Starts: warm-up 5′ · A 15′ · skill 30′ · B 41′ · cool-down 53′",
    });
  });
});

describe("startTimes", () => {
  it("names a single part WOD and adds the stretches after the last part", () => {
    const single = toWodState(fran);
    expect(startTimes(planClass(single), true, true)).toBe(
      `Starts: WOD ${WHITEBOARD_MINUTES}′ · cool-down ${WHITEBOARD_MINUTES + 12}′`,
    );
  });

  it("leaves out times that aren't known", () => {
    const unknown = { parts: [{ ...toWodState(fran).parts[0], minutes: null }] };
    expect(startTimes(planClass(unknown), true, true)).toBe(`Starts: WOD ${WHITEBOARD_MINUTES}′`);
  });
});
