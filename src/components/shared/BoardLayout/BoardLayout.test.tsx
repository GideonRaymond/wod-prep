// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BoardLayout } from "./BoardLayout";

describe("BoardLayout", () => {
  afterEach(() => {
    cleanup();
  });

  it("puts the board first, kept in view beside the page", () => {
    render(<BoardLayout board={<p>Board</p>}>Side</BoardLayout>);
    const board = screen.getByText("Board");
    expect(board.parentElement).toHaveClass("md:sticky", "md:top-6", "md:overflow-y-auto");
    expect(board.compareDocumentPosition(screen.getByText("Side"))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("can keep the board stuck to the top on phones too", () => {
    render(<BoardLayout board={<p>Board</p>}>Side</BoardLayout>);
    expect(screen.getByText("Board").parentElement).not.toHaveClass("max-md:sticky");
    cleanup();
    render(
      <BoardLayout board={<p>Board</p>} stickyOnPhones>
        Side
      </BoardLayout>,
    );
    expect(screen.getByText("Board").parentElement).toHaveClass("max-md:sticky", "max-md:top-0");
  });
});
