// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BoardFrame } from "./BoardFrame";

describe("BoardFrame", () => {
  afterEach(() => {
    cleanup();
  });

  it("is a chalkboard in a wooden frame, with whatever's written on it", () => {
    render(<BoardFrame aria-busy="true">Fran</BoardFrame>);
    const board = screen.getByText("Fran");
    expect(board).toHaveClass("bg-[#26262b]", "border-[#6b5a4a]", "chalk-dust", "min-h-80");
    expect(board).toHaveAttribute("aria-busy", "true");
  });

  it("takes extra classes", () => {
    render(<BoardFrame className="min-h-80">Fran</BoardFrame>);
    expect(screen.getByText("Fran")).toHaveClass("min-h-80");
  });
});
