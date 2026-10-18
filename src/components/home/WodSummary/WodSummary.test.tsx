// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { WodSummary } from "./WodSummary";
import type { WodState } from "@/types/wod";
import { fran } from "@/test/fixtures";
import { withId } from "@/utils/withId";

const initial: WodState = { ...fran, movements: fran.movements.map(withId) };

function Harness({ wod = initial }: { wod?: WodState }) {
  const [state, setState] = useState(wod);
  return <WodSummary wod={state} onChange={setState} />;
}

describe("WodSummary", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the title, format line and notes", () => {
    render(<Harness wod={{ ...initial, duration: "10 min cap", notes: "Partner WOD" }} />);
    expect(screen.getByRole("heading", { name: "Fran" })).toBeInTheDocument();
    expect(screen.getByText("For Time · 21-15-9 · 10 min cap")).toBeInTheDocument();
    expect(screen.getByText("Partner WOD")).toBeInTheDocument();
  });

  it("shows the stimulus and a card per movement", () => {
    render(<Harness />);
    expect(screen.getByText(fran.stimulus)).toBeInTheDocument();
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
