import { describe, expect, it } from "vitest";
import { fillMissingLabels } from "./fillMissingLabels";

const labels = (...values: (string | null)[]) =>
  fillMissingLabels(values.map((label) => ({ label }))).map((part) => part.label);

describe("fillMissingLabels", () => {
  it("deduces A when only B is labelled", () => {
    expect(labels(null, "B")).toEqual(["A", "B"]);
  });

  it("letters every part in order when none are labelled", () => {
    expect(labels(null, null, null)).toEqual(["A", "B", "C"]);
  });

  it("re-letters in order instead of duplicating an existing letter", () => {
    expect(labels(null, "A")).toEqual(["A", "B"]);
    expect(labels("A", null, "B")).toEqual(["A", "B", "C"]);
  });

  it("keeps descriptive labels, which don't use up a letter", () => {
    expect(labels(null, "B", "Cool-down")).toEqual(["A", "B", "Cool-down"]);
    expect(labels("Strength", null)).toEqual(["Strength", "A"]);
  });

  it("leaves fully labelled parts alone", () => {
    expect(labels("A", "C")).toEqual(["A", "C"]);
    expect(labels("Strength", "Metcon")).toEqual(["Strength", "Metcon"]);
  });

  it("leaves a single part without a label", () => {
    expect(labels(null)).toEqual([null]);
  });

  it("keeps the rest of each part", () => {
    const parts = fillMissingLabels([
      { label: null, title: "Nancy" },
      { label: "B", title: "Murph" },
    ]);
    expect(parts).toEqual([
      { label: "A", title: "Nancy" },
      { label: "B", title: "Murph" },
    ]);
  });
});
