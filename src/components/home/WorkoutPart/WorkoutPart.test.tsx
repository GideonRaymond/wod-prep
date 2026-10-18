// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WorkoutPart } from "./WorkoutPart";
import type { WorkoutPartState } from "@/types/wod";
import { franPart } from "@/test/fixtures";
import { toWodState } from "@/utils/toWodState";

const initial: WorkoutPartState = toWodState({ parts: [franPart] }).parts[0];

function Harness({
  part = initial,
  onChange,
}: {
  part?: WorkoutPartState;
  onChange?: (part: WorkoutPartState) => void;
}) {
  const [state, setState] = useState(part);
  return (
    <WorkoutPart
      part={state}
      onChange={(next) => {
        onChange?.(next);
        setState(next);
      }}
    />
  );
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

  it("uses the title as the heading", () => {
    render(<Harness />);
    expect(screen.getByRole("region", { name: "Fran" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Fran" })).toBeInTheDocument();
  });

  it.each(["A", "Cool-down"])("shows the %s label beside the title, not in it", (label) => {
    render(<Harness part={{ ...initial, label, title: "Easy Flush" }} />);
    expect(screen.getByRole("heading", { name: "Easy Flush" })).toBeInTheDocument();
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.queryByText(/Part /)).not.toBeInTheDocument();
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

  it("passes stimulus edits up so confirming uses the edited text", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Edit stimulus" }));
    await user.clear(screen.getByRole("textbox", { name: "Stimulus" }));
    await user.type(screen.getByRole("textbox", { name: "Stimulus" }), "Go easy.");

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        stimulus: { ...franPart.stimulus, description: "Go easy." },
        originalStimulus: franPart.stimulus.description,
      }),
    );
  });

  it("reverts to the parsed stimulus even after coming back to the page", async () => {
    const user = userEvent.setup();
    const edited = { ...initial, stimulus: { ...initial.stimulus, description: "Go easy." } };
    render(<Harness part={edited} />);
    expect(screen.getByText("Go easy.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Revert stimulus to original" }));
    expect(screen.getByText(franPart.stimulus.description)).toBeInTheDocument();
  });
});
