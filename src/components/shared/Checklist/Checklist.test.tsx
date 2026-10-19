// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { Flame } from "lucide-react";
import { afterEach, describe, expect, it } from "vitest";
import { Checklist, type ChecklistItem } from "./Checklist";

const items: ChecklistItem[] = [
  { id: "warmup", name: "Warm-up", icon: Flame, state: "done", meta: "12 min · Rower" },
  {
    id: "workout",
    name: "Workout",
    state: "working",
    children: [
      { id: "a", name: "Back squat", marker: "A", state: "working" },
      { id: "b", name: "Fran", marker: "B", state: "waiting" },
    ],
  },
];

describe("Checklist", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows each step's state in words, with its result", () => {
    render(<Checklist items={items} label="Getting it ready" />);
    expect(screen.getByRole("list", { name: "Getting it ready" })).toBeInTheDocument();
    const warmup = screen.getByText("Warm-up").closest("li")!;
    expect(within(warmup).getByRole("img", { name: "Done" })).toBeInTheDocument();
    expect(within(warmup).getByText("12 min · Rower")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "Working on it" })).toHaveLength(2);
    expect(screen.getByRole("img", { name: "Waiting" })).toBeInTheDocument();
  });

  it("nests a step's own steps under it, with their markers", () => {
    render(<Checklist items={items} />);
    const nested = screen.getByText("Back squat").closest("ul")!;
    expect(within(nested).getByText("A")).toBeInTheDocument();
    expect(within(nested).getByText("Fran")).toBeInTheDocument();
    expect(within(nested).queryByText("Warm-up")).not.toBeInTheDocument();
  });

  it("mutes the name of a step that hasn't started", () => {
    render(<Checklist items={items} />);
    expect(screen.getByText("Fran")).not.toHaveClass("font-medium");
    expect(screen.getByText("Back squat")).toHaveClass("font-medium");
  });
});
