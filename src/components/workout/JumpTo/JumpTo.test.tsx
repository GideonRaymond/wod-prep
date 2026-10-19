// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JumpTo } from "./JumpTo";

const stages = [
  { key: "pre", label: "Before class", marker: <span>i</span> },
  { key: "board", label: "Whiteboard", marker: <span>i</span> },
  { key: "b", label: "B · Fran", marker: <span>B</span> },
];

function setup(current = "board") {
  const handlers = { onJump: vi.fn(), onExpandAll: vi.fn(), onCollapseAll: vi.fn() };
  render(<JumpTo stages={stages} current={current} {...handlers} />);
  return { user: userEvent.setup(), ...handlers };
}

const button = () => screen.getByRole("button", { name: /Jump to/ });

describe("JumpTo", () => {
  afterEach(() => {
    cleanup();
  });

  it("names the current stage and starts closed", () => {
    setup();
    expect(button()).toHaveTextContent("Jump to· Whiteboard");
    expect(button()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lists every stage with the current one marked and focused", async () => {
    const { user } = setup();
    await user.click(button());
    const menu = within(screen.getByRole("dialog", { name: "Jump to" }));
    const whiteboard = menu.getByRole("button", { name: /Whiteboard/ });
    expect(whiteboard).toHaveAttribute("aria-current", "true");
    expect(whiteboard).toHaveFocus();
    expect(menu.getByRole("button", { name: /B · Fran/ })).toHaveAttribute("aria-current", "false");
  });

  it("jumps to a stage and closes", async () => {
    const { user, onJump } = setup();
    await user.click(button());
    await user.click(screen.getByRole("button", { name: /B · Fran/ }));
    expect(onJump).toHaveBeenCalledWith("b");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("expands and collapses all stages", async () => {
    const { user, onExpandAll, onCollapseAll } = setup();
    await user.click(button());
    await user.click(screen.getByRole("button", { name: "Expand all" }));
    await user.click(screen.getByRole("button", { name: "Collapse all" }));
    expect(onExpandAll).toHaveBeenCalledOnce();
    expect(onCollapseAll).toHaveBeenCalledOnce();
  });

  it("closes on Escape and returns focus to the button", async () => {
    const { user } = setup();
    await user.click(button());
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(button()).toHaveFocus();
  });
});
