// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FlowPage } from "./FlowPage";

describe("FlowPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("puts the stepper first, then the board beside the page", () => {
    render(
      <FlowPage step={1} board={<p>Board</p>}>
        <p>Side</p>
      </FlowPage>,
    );
    const stepper = screen.getByRole("navigation", { name: "Progress" });
    const board = screen.getByText("Board");
    expect(stepper.compareDocumentPosition(board)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(board.parentElement).toHaveClass("md:sticky");
    expect(screen.getByText("Check").closest("[aria-current]")).toBeInTheDocument();
  });

  it("shows the logo, linking home, above everything else", () => {
    render(
      <FlowPage step={2}>
        <p>Side</p>
      </FlowPage>,
    );
    const logo = screen.getByRole("link", { name: "Chalkup" });
    expect(logo).toHaveAttribute("href", "/");
    expect(logo.compareDocumentPosition(screen.getByRole("navigation", { name: "Progress" }))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("is a single column without a board", () => {
    render(
      <FlowPage step={1}>
        <p>Side</p>
      </FlowPage>,
    );
    expect(screen.getByText("Side").closest(".max-w-2xl")).toBeInTheDocument();
    expect(document.querySelector(".md\\:sticky")).toBeNull();
  });

  it("passes on keeping the board stuck to the top on phones", () => {
    render(
      <FlowPage step={2} board={<p>Board</p>} stickyBoardOnPhones>
        <p>Side</p>
      </FlowPage>,
    );
    expect(screen.getByText("Board").parentElement).toHaveClass("max-md:sticky");
  });
});
