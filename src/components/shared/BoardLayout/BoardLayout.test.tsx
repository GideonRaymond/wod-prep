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
    expect(board.parentElement).toHaveClass("md:sticky");
    expect(board.compareDocumentPosition(screen.getByText("Side"))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
});
