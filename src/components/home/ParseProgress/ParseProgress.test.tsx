// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ParseProgress, parseChecklist } from "./ParseProgress";
import { strengthAndMetcon } from "@/test/fixtures";
import { outlineOf } from "@/test/parseStream";

const outline = outlineOf(strengthAndMetcon);

describe("parseChecklist", () => {
  it("is reading the workout until the structure is found", () => {
    expect(parseChecklist({ outline: null, read: new Set() })).toEqual([
      expect.objectContaining({ id: "reading", state: "working" }),
    ]);
  });

  it("lists each part found, ticking off the ones read", () => {
    const [reading, a, b, cooldown] = parseChecklist({ outline, read: new Set([1]) });
    expect(reading).toMatchObject({ state: "done", meta: "3 parts found" });
    expect(a).toMatchObject({ name: "Heavy Back Squats", marker: "A", state: "working" });
    expect(b).toMatchObject({ name: "Fran", marker: "B", state: "done" });
    expect(cooldown).toMatchObject({ name: "Easy Flush", state: "working" });
    expect(cooldown.icon).toBeDefined();
  });

  it("marks a single part as WOD", () => {
    const [, only] = parseChecklist({ outline: [{ ...outline[1], label: null }], read: new Set() });
    expect(only.marker).toBe("WOD");
  });
});

describe("ParseProgress", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the parts found so far", () => {
    render(<ParseProgress progress={{ outline, read: new Set([0]) }} />);
    expect(screen.getByRole("region", { name: "Reading your workout" })).toBeInTheDocument();
    expect(screen.getByText("3 parts found")).toBeInTheDocument();
    expect(screen.getByText("Fran")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "Done" })).toHaveLength(2);
  });
});
