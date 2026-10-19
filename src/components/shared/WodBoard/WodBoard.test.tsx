// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { WodBoard } from "./WodBoard";
import { fran, strengthAndMetcon } from "@/test/fixtures";
import { toWodState } from "@/utils/toWodState";

const parts = toWodState(strengthAndMetcon).parts;
const unnamed = parts.map((part) => ({ ...part, named: false }));

describe("WodBoard", () => {
  afterEach(() => {
    cleanup();
  });

  it("writes each part's whiteboard heading in marker and the rest in handwriting", () => {
    const murph = {
      ...parts[1],
      board: ["B. Murph", "For time", "1 mile run", "", "100 pull-ups"],
    };
    render(<WodBoard parts={[parts[0], murph]} />);
    expect(screen.getByText("B. Murph")).toHaveClass("font-permanent-marker");
    expect(screen.getByText("For time")).toHaveClass("font-kalam");
    expect(screen.getByText("100 pull-ups")).toHaveClass("font-kalam");
    expect(screen.queryByText(parts[1].sourceText)).not.toBeInTheDocument();
  });

  it("writes out the part's own text when it was saved without whiteboard lines", () => {
    const old = {
      ...parts[1],
      board: undefined,
      sourceText: 'B) "Fran"\n21-15-9 for time\n\nPull-ups',
    };
    render(<WodBoard parts={[old]} />);
    expect(screen.getByText('B) "Fran"')).toHaveClass("font-permanent-marker");
    expect(screen.getByText("21-15-9 for time")).toHaveClass("font-kalam");
  });

  it("inks each heading in its own purple", () => {
    render(<WodBoard parts={parts} />);
    const headings = parts.map((part) => screen.getByText(part.board![0]));
    expect(headings.map((h) => [...h.classList].find((c) => c.startsWith("text-purple")))).toEqual([
      "text-purple-800",
      "text-purple-600",
      "text-purple-700",
    ]);
  });

  it("heads the board with WOD when no part has a real name", () => {
    render(<WodBoard parts={unnamed} />);
    expect(screen.getByText("WOD")).toHaveClass("font-permanent-marker");
  });

  it("leaves the heading to the workout's own text when it has a name", () => {
    render(<WodBoard parts={toWodState(fran).parts} />);
    expect(screen.queryByText("WOD")).not.toBeInTheDocument();
    render(<WodBoard parts={parts} />);
    expect(screen.queryByText("WOD")).not.toBeInTheDocument();
  });

  it("has no label, markers or circles of its own", () => {
    const { container } = render(<WodBoard parts={parts} />);
    expect(screen.queryByText("Your workout")).not.toBeInTheDocument();
    expect(screen.queryByText("A")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("can show the whole board on phones", async () => {
    render(<WodBoard parts={parts} />);
    const toggle = screen.getByRole("button", { name: "Show all" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("adds a planned warm-up above the parts and stretches under them, in blue", () => {
    render(
      <WodBoard
        parts={parts.slice(0, 2)}
        warmup={{ heading: "Warm-up", lines: ["Easy row – 2 min"] }}
        cooldown={{ heading: "Cool-down", lines: ["Couch stretch – 60 s each side"] }}
      />,
    );
    const headings = screen
      .getAllByText(/./, { selector: ".font-permanent-marker" })
      .map((h) => h.textContent);
    expect(headings).toEqual(["Warm-up", "A. Back Squat", "B. Fran", "Cool-down"]);
    expect(screen.getByText("Warm-up")).toHaveClass("text-sky-800");
    expect(screen.getByText("Couch stretch – 60 s each side").parentElement).toHaveClass(
      "text-sky-800",
    );
  });

  it("writes on what's added after it first shows, and not what was already there", () => {
    const { rerender } = render(<WodBoard parts={parts.slice(0, 1)} writing />);
    expect(screen.getByText("A. Back Squat").parentElement).not.toHaveClass(
      "motion-safe:animate-rise-in",
    );
    rerender(<WodBoard parts={parts.slice(0, 2)} warmup={{ heading: "Warm-up", lines: [] }} />);
    expect(screen.getByText("B. Fran").parentElement).toHaveClass("motion-safe:animate-rise-in");
    expect(screen.getByText("Warm-up").parentElement).toHaveClass("motion-safe:animate-rise-in");
  });

  it("draws a line where the next part goes while it's being written", () => {
    const { container, rerender } = render(<WodBoard parts={[]} writing />);
    expect(screen.getByTestId("board-writing")).toHaveAttribute("aria-hidden");
    expect(container.firstChild).toHaveAttribute("aria-busy", "true");
    rerender(<WodBoard parts={parts} />);
    expect(screen.queryByTestId("board-writing")).not.toBeInTheDocument();
    expect(container.firstChild).not.toHaveAttribute("aria-busy");
  });
});
