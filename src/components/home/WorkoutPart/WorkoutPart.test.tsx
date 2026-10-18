// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { WorkoutPart } from "./WorkoutPart";
import type { WorkoutPartState } from "@/types/wod";
import { franPart } from "@/test/fixtures";
import { withId } from "@/utils/withId";

const initial: WorkoutPartState = withId({
  ...franPart,
  movements: franPart.movements.map(withId),
});

function Harness({ part = initial }: { part?: WorkoutPartState }) {
  const [state, setState] = useState(part);
  return <WorkoutPart part={state} onChange={setState} />;
}

describe("WorkoutPart", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the title, format line and notes", () => {
    render(<Harness part={{ ...initial, duration: "10 min cap", notes: "Partner WOD" }} />);
    expect(screen.getByRole("heading", { name: "Fran" })).toBeInTheDocument();
    expect(screen.getByText("For Time · 21-15-9 · 10 min cap")).toBeInTheDocument();
    expect(screen.getByText("Partner WOD")).toBeInTheDocument();
  });

  it.each([
    [{ label: "A", title: null }, "Part A"],
    [{ label: "b", title: "Fran" }, "Part B: Fran"],
    [{ label: "Cool-down", title: null }, "Cool-down"],
    [{ label: null, title: "Fran" }, "Fran"],
  ])("names the part %o as %s", (names, heading) => {
    render(<Harness part={{ ...initial, ...names }} />);
    expect(screen.getByRole("region", { name: heading })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  });

  it("shows no heading for an untitled single-part WOD", () => {
    render(<Harness part={{ ...initial, label: null, title: null }} />);
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
    expect(screen.getByText("For Time · 21-15-9")).toBeInTheDocument();
  });

  it("shows the stimulus with its intensity and a card per movement", () => {
    render(<Harness />);
    expect(screen.getByText(franPart.stimulus.description)).toBeInTheDocument();
    expect(screen.getByRole("meter", { name: "Intensity" })).toHaveAttribute("aria-valuenow", "9");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("removes a movement", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Remove Thruster" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("adds a movement", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Add movement" }));
    await user.type(screen.getByPlaceholderText(/Movement/), "Wall Balls");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByRole("heading", { name: "Wall Balls" })).toBeInTheDocument();
  });

  it("merges a movement that's added again", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Add movement" }));
    await user.type(screen.getByPlaceholderText(/Movement/), "Pull-ups");
    await user.type(screen.getByPlaceholderText(/Reps/), "10");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "Merge" }));

    const cards = screen.getAllByRole("listitem");
    expect(cards).toHaveLength(2);
    expect(within(cards[1]).getByTitle("Reps")).toHaveTextContent("21-15-9 + 10");
  });
});
