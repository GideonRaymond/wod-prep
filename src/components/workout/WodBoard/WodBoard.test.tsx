// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { WodBoard } from "./WodBoard";
import { fran, strengthAndMetcon } from "@/test/fixtures";
import { toWodState } from "@/utils/toWodState";

const parts = toWodState(strengthAndMetcon).parts;

describe("WodBoard", () => {
  afterEach(() => {
    cleanup();
  });

  it("writes each part's first line in marker and the rest in handwriting", () => {
    const franPart = { ...parts[1], sourceText: 'B) "Fran"\n21-15-9 for time\n\nPull-ups' };
    render(<WodBoard parts={[parts[0], franPart]} />);
    expect(screen.getByText('B) "Fran"')).toHaveClass("font-permanent-marker");
    expect(screen.getByText("21-15-9 for time")).toHaveClass("font-kalam");
    expect(screen.getByText("Pull-ups")).toHaveClass("font-kalam");
  });

  it("inks each heading in its own purple", () => {
    render(<WodBoard parts={parts} />);
    const headings = parts.map((part) => screen.getByText(part.sourceText.split("\n")[0]));
    expect(headings.map((h) => [...h.classList].find((c) => c.startsWith("text-purple")))).toEqual([
      "text-purple-800",
      "text-purple-600",
      "text-purple-700",
    ]);
  });

  it("circles every part once it's up, with its marker", async () => {
    const { container } = render(<WodBoard parts={parts} />);
    await waitFor(() => expect(container.querySelectorAll("[data-circled]")).toHaveLength(3));
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(container.querySelector("svg.lucide-snowflake")).toBeInTheDocument();
  });

  it("marks a single-part workout WOD", () => {
    render(<WodBoard parts={toWodState(fran).parts} />);
    expect(screen.getByText("WOD")).toBeInTheDocument();
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
});
