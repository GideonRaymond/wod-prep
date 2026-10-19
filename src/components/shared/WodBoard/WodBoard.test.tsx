// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WodBoard, type BoardNav } from "./WodBoard";
import { strengthAndMetcon } from "@/test/fixtures";
import type { BoardItem } from "@/types/wod";
import { partsBoard } from "@/utils/boardItems";
import { toWodState } from "@/utils/toWodState";

const board = partsBoard(toWodState(strengthAndMetcon).parts);
const [squats, fran, cooldown] = board.items;
const warmup: BoardItem = {
  key: "planned-warmup",
  heading: "Warm-up – 10 min",
  lines: [],
  added: true,
};
const markers = () =>
  screen.getAllByText(/./, { selector: ".font-permanent-marker" }).map((h) => h.textContent);

describe("WodBoard", () => {
  afterEach(() => {
    cleanup();
  });

  it("writes each block's heading in marker and its lines in handwriting", () => {
    render(
      <WodBoard items={[{ key: "m", heading: "Murph", lines: ["For time", "1 mile run"] }]} />,
    );
    expect(screen.getByText("Murph")).toHaveClass("font-permanent-marker");
    expect(screen.getByText("1 mile run")).toHaveClass("font-kalam");
  });

  it("inks each part's heading in its own purple, and the app's own blocks in blue", () => {
    render(<WodBoard items={[warmup, squats, fran, cooldown]} />);
    const ink = (text: string) =>
      [...screen.getByText(text).classList].find((c) => /^text-(purple|sky)-\d/.test(c));
    expect([squats, fran, cooldown].map((item) => ink(item.heading))).toEqual([
      "text-purple-800",
      "text-purple-600",
      "text-purple-700",
    ]);
    expect(ink("Warm-up – 10 min")).toBe("text-sky-800");
  });

  it("heads the board with its title, if it has one", () => {
    render(<WodBoard items={[squats]} title="WOD" />);
    expect(markers()).toEqual(["WOD", "A. Back Squat"]);
    cleanup();
    render(<WodBoard {...board} />);
    expect(screen.queryByText("WOD")).not.toBeInTheDocument();
  });

  it("writes on what's added after it first shows, and not what was already there", () => {
    const { rerender } = render(<WodBoard items={[squats]} writing />);
    expect(screen.getByText("A. Back Squat").parentElement).not.toHaveClass(
      "motion-safe:animate-rise-in",
    );
    rerender(<WodBoard items={[warmup, squats, fran]} />);
    expect(screen.getByText("B. Fran").parentElement).toHaveClass("motion-safe:animate-rise-in");
    expect(screen.getByText("Warm-up – 10 min").parentElement).toHaveClass(
      "motion-safe:animate-rise-in",
    );
  });

  it("draws a line where the next part goes while it's being written", () => {
    const { container, rerender } = render(<WodBoard items={[]} writing />);
    expect(screen.getByTestId("board-writing")).toHaveAttribute("aria-hidden");
    expect(container.firstChild).toHaveAttribute("aria-busy", "true");
    rerender(<WodBoard {...board} />);
    expect(screen.queryByTestId("board-writing")).not.toBeInTheDocument();
    expect(container.firstChild).not.toHaveAttribute("aria-busy");
  });

  it("is a short preview on phones until Show all", async () => {
    render(<WodBoard {...board} />);
    const toggle = screen.getByRole("button", { name: "Show all" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle.closest(".min-h-80")).toHaveClass("max-sm:min-h-0");
    await userEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(toggle.closest(".min-h-80")).not.toHaveClass("max-sm:min-h-0");
    expect(screen.queryByRole("button", { name: /^A\. Back Squat/ })).not.toBeInTheDocument();
  });

  describe("as the class's table of contents", () => {
    function renderNav(nav: Partial<BoardNav> = {}) {
      const onJump = vi.fn();
      render(
        <WodBoard
          items={[warmup, squats, fran]}
          nav={{
            current: fran.key,
            currentLabel: "B · Fran",
            links: [
              { key: "pre", label: "Before class" },
              { key: "briefing", label: "Briefing" },
            ],
            onJump,
            ...nav,
          }}
        />,
      );
      return { onJump, user: userEvent.setup() };
    }
    const block = (name: RegExp) =>
      within(screen.getByRole("list", { name: "Whiteboard" })).getByRole("button", { name });

    it("jumps to a block's section when it's clicked", async () => {
      const { onJump, user } = renderNav();
      await user.click(block(/^Warm-up – 10 min/));
      expect(onJump).toHaveBeenCalledWith("planned-warmup");
      await user.click(block(/^A\. Back Squat/));
      expect(onJump).toHaveBeenLastCalledWith(squats.key);
    });

    it("links the sections that aren't on the board above it", async () => {
      const { onJump, user } = renderNav();
      const links = within(screen.getByRole("list", { name: "Before the board" }));
      await user.click(links.getByRole("button", { name: "Briefing" }));
      expect(onJump).toHaveBeenCalledWith("briefing");
    });

    it("outlines the block on screen", () => {
      renderNav();
      expect(block(/^B\. Fran/)).toHaveAttribute("aria-current", "location");
      expect(block(/^B\. Fran/)).toHaveClass("outline-2");
      expect(block(/^A\. Back Squat/)).not.toHaveAttribute("aria-current");
      expect(block(/^A\. Back Squat/)).not.toHaveClass("outline-2");
    });

    it("folds into a bar named after the section on screen on phones, which opens the board", async () => {
      const { user, onJump } = renderNav();
      const bar = screen.getByRole("button", { name: /^B · Fran/ });
      expect(bar).toHaveClass("md:hidden");
      expect(bar).toHaveAttribute("aria-expanded", "false");
      const content = document.getElementById(bar.getAttribute("aria-controls")!)!;
      expect(content).toHaveClass("max-md:hidden");

      await user.click(bar);
      expect(bar).toHaveAttribute("aria-expanded", "true");
      expect(content).not.toHaveClass("max-md:hidden");

      // Picking a section folds it again.
      await user.click(block(/^A\. Back Squat/));
      expect(onJump).toHaveBeenCalledWith(squats.key);
      expect(bar).toHaveAttribute("aria-expanded", "false");
    });

    it("says Whiteboard on the bar before a section is on screen", () => {
      renderNav({ currentLabel: undefined });
      expect(screen.getByRole("button", { name: /^Whiteboard/ })).toBeInTheDocument();
    });

    it("can expand or collapse every section from the open board on phones", async () => {
      const onExpandAll = vi.fn();
      const { user } = renderNav({ onExpandAll });
      await user.click(screen.getByRole("button", { name: "Expand all" }));
      expect(onExpandAll).toHaveBeenCalled();
    });

    it("has no Show all preview", () => {
      renderNav();
      expect(screen.queryByRole("button", { name: "Show all" })).not.toBeInTheDocument();
    });
  });
});
