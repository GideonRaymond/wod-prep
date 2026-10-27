// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BoardFrame } from "./BoardFrame";

describe("BoardFrame", () => {
  afterEach(() => {
    cleanup();
  });

  it("is a chalkboard in an ash frame, with whatever's written on it", () => {
    render(<BoardFrame aria-busy="true">Fran</BoardFrame>);
    const board = screen.getByText("Fran");
    expect(board).toHaveClass("bg-[#26262b]", "chalk-dust", "min-h-80");
    expect(board).toHaveAttribute("aria-busy", "true");
    const frame = board.parentElement!;
    expect(frame).toHaveClass("ash-frame");
    expect(frame.querySelectorAll(".ash-bar")).toHaveLength(4);
  });

  it("has a ledge with chalk and an eraser underneath, hidden from screen readers", () => {
    render(<BoardFrame>Fran</BoardFrame>);
    const ledge = screen.getByTestId("board-ledge");
    expect(ledge).toHaveAttribute("aria-hidden");
    expect(ledge.querySelectorAll(".ash-ledge-chalk")).toHaveLength(2);
  });

  it("puts frame classes on the whole object", () => {
    render(<BoardFrame frameClassName="ring-2">Fran</BoardFrame>);
    expect(screen.getByText("Fran").closest(".ash-board")).toHaveClass("ring-2");
  });

  it("takes extra classes", () => {
    render(<BoardFrame className="min-h-80">Fran</BoardFrame>);
    expect(screen.getByText("Fran")).toHaveClass("min-h-80");
  });
});
